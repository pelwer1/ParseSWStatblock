// SWADE STAT BLOCK IMPORTER FOR ROLL20 API
// 
// Command Line: !SW-Import
//
//  pelwer - 12/28/18 
// 	Hacked to parse swade stat block from pdf
//  pelwer - 9/8/19
//    Upgraded the parser based on post from Aaron
//    https://wiki.roll20.net/API:Cookbook#decodeEditorText
//  pelwer - 2/16/2020
//    added parse for undead, construct to set combat reflex
//    added parse for Endurance to set Iron Jaw
//    turned on Wild die for everything - can decide in the game whether ot use it or whether the thing is a WC
// 	
// 	INSTRUCTIONS
// 	1. Find yourself a SW stat-block (doesn't have to be SWADE, SWD version works fine too)
// 	2. Copy the stat block from *Name* on down
//         2.2 Paste into a plain text editor. 
//         2.4 Prepend [WC!] in first column of first line to make the creature a wildcard
//         2.6 Select and copy the text again
// 	3. Paste the stat block into the GM Notes Section of a token in your roll20 campaign.
// 	4. Select the token 
//      5. In the chat box, type the command "!SW-Import".
//
//      Alternative:
//        Found that Shift-Ctrl-V in Roll20 pastes in plain text.  
//        This allows you to skip the paste into the text editor
// 
//---------------------------------------------------
//  Original Author Jason.P 18/1/2015 - ported from Version 2.25
//  Thread: https://app.roll20.net/forum/post/1517881/pathfinder-statblock-import-to-character-sheet-script/?pagenum=2
// ---------------------------------------------------------
// js beautify json options:   https://beautifier.io/
// {
//   "indent_size": "3",
//   "indent_char": " ",
//   "max_preserve_newlines": "2",
//   "preserve_newlines": true,
//   "keep_array_indentation": false,
//   "break_chained_methods": false,
//   "indent_scripts": "normal",
//   "brace_style": "end-expand",
//   "space_before_conditional": true,
//   "unescape_strings": false,
//   "jslint_happy": false,
//   "end_with_newline": false,
//   "wrap_line_length": "0",
//   "indent_inner_html": false,
//   "comma_first": false,
//   "e4x": false
// }

// New gmnotes parsing clean up from Aaron:  9/8/19
// Given the text from a Graphic's gmnotes property, or a Character's bio or gmnotes 
// property, or a Handout's notes or gmnotes property, this will return a version with 
// the auto-inserted editor formatting stripped out.
//
// Usage:
//  The first argument is the text to process.
//    const text = decodeEditorText(token.get('gmnotes'));
// By default, the lines of text will be separated by \r\n.
// The optional second argument is an object with options.
// separator -- specifies what to separate lines of text with. Default: \r\n
//    const text = decodeEditorText(token.get('gmnotes'),{separator:'<BR>'});
// asArray -- specifies to instead return the lines as an array. Default: false
//    const text = decodeEditorText(token.get('gmnotes'),{asArray:true});
const decodeEditorText = (t, o) =>{
  let w = t;
  o = Object.assign({ separator: '\r\n', asArray: false },o);
  /* Token GM Notes */
  if(/^%3Cp%3E/.test(w)){
    w = unescape(w);
  }
  if(/^<p>/.test(w)){
    let lines = w.match(/<p>.*?<\/p>/g)
      .map( l => l.replace(/^<p>(.*?)<\/p>$/,'$1'));
    return o.asArray ? lines : lines.join(o.separator);
  }
  /* neither */
  return t;
};




// Usage:
//   AddAttribute("size",sizeNum,charID);
function AddAttribute(attr, value, charID) {
   if (value === undefined) {
      log(attr + " has returned an undefined value.");
      sendChat("Error on " + attr + " attribute", "This attribute has been ignored.");
   }
   else {
      createObj("attribute", {
         name: attr,
         current: value,
         characterid: charID

      });
      //use the line below for diagnostics!
      // sendChat("", "Attribute: Value = " + attr + ": " + value);
   }
   return;
}

// convert SWADE die value to Roll20 exploding die format.  e.g. d12+2 --> d12!+2
function dieConvert(str) {
   var parsedDice = [];

   if (/d\d+\+\d+/.test(str)) { // d12+2
      parsedDice = str.match(/(d\d+)(\+\d+)/); // [1] = d12;  [2] = +2;
      return (parsedDice[1] + '!' + parsedDice[2]);
   }
   else { // d12
      return (str + '!'); // d12!
   }
}

// -----------------------------------  START ----------------------------
// catch the invocation command (!SWADE-Import )
// start parsing the GM notes
on('chat:message', function(msg) {

   // Only run when message is an api type and contains "!PathfinderImport"
   if (msg.type === 'api' && msg.content.indexOf('!SW-Import') !== -1) {

      // Make sure there's a selected object
      if (!(msg.selected && msg.selected.length > 0)) {
         sendChat("ERROR", "No Token Selected.");
         return;
      }

      // Don't try to set up a drawing or card 
      var token = getObj('graphic', msg.selected[0]._id);
      if (token.get('subtype') !== 'token') {
         sendChat("ERROR", "Must select a Token, not a drawing or a card.");
         return;
      }

      //*************  START CREATING CHARACTER****************
      var verboseMode = 0;

      // get notes from token
      var originalGmNotes = token.get('gmnotes');
      const text = decodeEditorText(token.get('gmnotes'),{separator:'<BR>'});
      var gmNotes = text;
      if (!gmNotes) {
         sendChat("ERROR", "GM Notes is empty.");
         return;
      }
      // sendChat("","Post Decode gmNotes = [" + gmNotes + "]" );
		// return;
      
      //break the string down by line returns     
      var data = [];
      data = gmNotes.split('<BR>'); // post aaron change

      //clean any characters excepting text and hyperlinks
      var charNameLine = "";
      var charName = "";
      var wildCard = 0;
      var skipLoop = 0;
      for (var i = 0; i < data.length; i++) {
         data[i] = data[i].trim();
         // grab the first line with text
         if (/[A-Z]+/.test(data[i]) && !skipLoop) {
            skipLoop = 1;
            charNameLine = data[i];

            // prepend [WC!] in first column of first line to make the creature a wildcard 
            if (charNameLine.match(/^\[WC\!\]/)) {
               wildCard = 1;
            }
            // get the name of the monster to build the journal entry
            if (wildCard) {
               charName = charNameLine.match(/^\[WC\!\](.*)/)[1];
            }
            else {
               charName = charNameLine.match(/^(.*)/)[1];
            }
         }
      }
      if (verboseMode) {
         sendChat('', 'charName = [' + charName + ']');
         sendChat("", "Wild Card: = [" + wildCard + "]");
      }

      // This javascript replaces all 3 types of line breaks with a space
      // This makes gmNotes 1 line of text
      gmNotes = gmNotes.replace(/([\r\n]+)/gm, " ");

      //Replace all double white spaces with single spaces
      gmNotes = gmNotes.replace(/\s+/g, ' ');
      gmNotes = gmNotes.trim();

      // ------------------------------------------
      // ----- start extracting attributes --------
      // ------------------------------------------

      // Attributes
      var agility = '';
      var smarts = '';
      var spirit = '';
      var strength = '';
      var vigor = '';

      if (!(/Agility/.test(gmNotes) && /Smarts/.test(gmNotes) && /Spirit/.test(gmNotes) && /Strength/.test(gmNotes) && /Vigor/.test(gmNotes))) {
         sendChat("ERROR", "Attributes (Agility, Strength, etc.) not found in GM Notes!");
         return;
      }
      //                                   d 12 + 2
      agility = gmNotes.match(/\Agility\s+(d\d+\+?\d*)/)[1];
      smarts = gmNotes.match(/\Smarts\s+(d\d+\+?\d*)/)[1];
      spirit = gmNotes.match(/\Spirit\s+(d\d+\+?\d*)/)[1];
      strength = gmNotes.match(/\Strength\s+(d\d+\+?\d*)/)[1];
      vigor = gmNotes.match(/\Vigor\s+(d\d+\+?\d*)/)[1];

      // Skills
      var combat = '1';
      var fighting = '4';
      var shooting = '4';
      var intimpers = '1';
      var intim = '1';
      var pers = '1';
      var athletics = 'd4';
      var notice = 'd4';
      var stealth = 'd4';
      var arcane = 'd4';

      // grab only the die size for the compare
      if (/Fighting\s+d(\d+)/.test(gmNotes)) {
         fighting = gmNotes.match(/Fighting\s+d(\d+)/)[1];
      }
      if (/Shooting\s+d(\d+)/.test(gmNotes)) {
         shooting = gmNotes.match(/Shooting\s+d(\d+)/)[1];
      }
      // now get the full dice string
      if (parseInt(shooting, 10) > parseInt(fighting, 10)) {
         combat = gmNotes.match(/Shooting\s+(d\d+\+?\d*)/)[1];
      }
      else {
         combat = gmNotes.match(/Fighting\s+(d\d+\+?\d*)/)[1];
      }

      // grab only the die size for the compare
      if (/Intimidation\s+d(\d+)/.test(gmNotes)) {
         intim = gmNotes.match(/Intimidation\s+d(\d+)/)[1];
      }
      if (/Persuasion\s+d(\d+)/.test(gmNotes)) {
         pers = gmNotes.match(/Persuasion\s+d(\d+)/)[1];
      }
      if (parseInt(pers, 10) > parseInt(intimpers, 10)) {
         intimpers = gmNotes.match(/Persuasion\s+(d\d+\+?\d*)/)[1];
      }
      else if (intim === '1') { // no intim skill 
         intimpers = 'd4';
      }
      else {
         intimpers = gmNotes.match(/Intimidation\s+(d\d+\+?\d*)/)[1];
      }

      if (/Athletics\s+(d\d+\+?\d*)/.test(gmNotes)) {
         athletics = gmNotes.match(/Athletics\s+(d\d+\+?\d*)/)[1];
      }

      
      if (/Notice\s+(d\d+\+?\d*)/.test(gmNotes)) {
         notice = gmNotes.match(/Notice\s+(d\d+\+?\d*)/)[1];
      }
      if (/Stealth\s+(d\d+\+?\d*)/.test(gmNotes)) {
         stealth = gmNotes.match(/Stealth\s+(d\d+\+?\d*)/)[1];
      }
      if (/[Spellcasting|Focus|Faith|Psionics|Weird Science|Arcane]\s+(d\d+\+?\d*)/.test(gmNotes)) {
         arcane = gmNotes.match(/[Spellcasting|Spellweaving|Runecasting|Focus|Faith|Psionics|Weird Science|Arcane]\s+(d\d+\+?\d*)/)[1];
      }

      // Derived Stats
      var pace = 6;
      var parry = 5;
      var toughness = 5;
      var armor = 0;
      var size = 0;
      if (/Pace:\s+(\d+)/.test(gmNotes)) {
         pace = gmNotes.match(/Pace:\s+(\d+)/)[1];
      }
      if (/Parry:\s+(\d+)/.test(gmNotes)) {
         parry = gmNotes.match(/Parry:\s+(\d+)/)[1];
      }
      if (/Toughness:\s+(\d+)/.test(gmNotes)) {
         toughness = gmNotes.match(/Toughness:\s+(\d+)/)[1];
      }
      // Toughness: 12 (4) 
      if (/Toughness:\s+\d+\s*\((\d+)\)/.test(gmNotes)) {
         armor = gmNotes.match(/Toughness:\s+\d+\s*\((\d+)\)/)[1];
      }
      //    Size 1  Size +1 
      if (/Size\s+\+?(\d+)/.test(gmNotes)) {
         size = gmNotes.match(/Size\s+\+?(\d+)/)[1];
      }

      // Edges
      var initEdges = '0,';
      var cbtReflex = '0';
      var ironJaw = '0';
      var wildDie = '1';  // Turn on the wild die 
      if (/(Edges|Special Abilities):.*Quick/.test(gmNotes)) {
         initEdges = initEdges + 'Qui,';
      }
      if (/(Edges|Special Abilities):.*Improved Level Head/.test(gmNotes)) {
         initEdges = initEdges + 'ILH,';
      }
      if (/(Edges|Special Abilities):.*Level Head/.test(gmNotes)) {
         initEdges = initEdges + 'LH,';
      }
      if (/(Edges|Special Abilities):.*Tactician/.test(gmNotes)) {
         initEdges = initEdges + 'TT,';
      }
      if (/(Edges|Special Abilities):.*Master Tactician/.test(gmNotes)) {
         initEdges = initEdges + 'MTT,';
      }
      if (/(Edges|Special Abilities):.*Mighty Blow/.test(gmNotes)) {
         initEdges = initEdges + 'WCE,';
      }
      if (/(Edges|Special Abilities):.*Dead Shot/.test(gmNotes)) {
         initEdges = initEdges + 'WCE,';
      }
      if (/(Edges|Special Abilities):.*Combat Reflex/.test(gmNotes)) {
         cbtReflex = '1';
      }
      if (/(Edges|Special Abilities):.*Undead/.test(gmNotes)) {
         cbtReflex = '1';
      }
      if (/(Edges|Special Abilities):.*Construct/.test(gmNotes)) {
         cbtReflex = '1';
      }
      if (/(Edges|Special Abilities):.*Iron Jaw/.test(gmNotes)) {
         ironJaw = '1';
      }      
      if (/(Edges|Special Abilities):.*Endurance/.test(gmNotes)) {
         ironJaw = '1';
      }
      // give a non wildcard a wild die
//      if (/(Edges|Special Abilities):.*Wild Die/.test(gmNotes)) {
//         wildDie = '1';
//      }


      // Damage
      var melee = 'd6'; // Str+2d6+2
      var ranged = '2d6!';
      //    Str +  2 d 10 +
      if (/Str\+(\d*d\d+\+?\d*)/.test(gmNotes)) {
         melee = gmNotes.match(/Str\+(\d*d\d+\+?\d*)/)[1];
      }

      if (verboseMode) {
         sendChat('', 'AGI: ' + agility);
         sendChat("", "SMA: " + smarts);
         sendChat("", "SPI: " + spirit);
         sendChat("", "STR: " + strength);
         sendChat("", "VIG: " + vigor);
         sendChat("", "Combat: " + combat);
         sendChat("", "Athletics: " + athletics);
         sendChat("", "IntimPers: " + intimpers);
         sendChat("", "Notice: " + notice);
         sendChat("", "Stealth: " + stealth);
         sendChat("", "Arcane: " + arcane);
         sendChat("", "Pace: " + pace);
         sendChat("", "Parry: " + parry);
         sendChat("", "Toughness: " + toughness);
         sendChat("", "Armor: " + armor);
         sendChat("", "Size: " + size);
         sendChat("", "Melee: " + melee);
         sendChat("", "Ranged: " + ranged);
         sendChat("", "InitEdges: " + initEdges);
         sendChat("", "CombatReflex: " + cbtReflex);
         sendChat("", "IronJaw: " + ironJaw);

      }

      // Build the character sheet with attributes

      // check if the character sheet entry already exists, if so error and exit.
      var CheckSheet = findObjs({
         _type: "character",
         name: charName
      });
      if (CheckSheet.length > 0) {
         sendChat("ERROR", "This character already exists.");
         return;
      };

      // rename and configure the token
      //  Name p/p/t(a)[s]@  = Name pace/parry/toughness(armor){size}@ (@ if WildCard)
      var tokenName = charName + " " + pace + "/" + parry + "/" + toughness + "(" + armor + "){" + size + "}";
      if (wildCard) {
         tokenName = tokenName + "@";
      }
      // sendChat("", "token name: " + tokenName);
      token.set("name", tokenName);
      token.set("showname", true);
      token.set("showplayers_name", false);
      
      //Create character entry in journal, token image = avatar image
      var character = createObj("character", {
         avatar: token.get("imgsrc"),
         name: charName,
         archived: false
      });
 
      // format GM notes for Bio
      gmNotes = gmNotes.replace(/\[WC\!\]/, '<b>[WC!]</b> ');
      gmNotes = gmNotes.replace(charName, '<b>' + charName +'</b><br>');
      gmNotes = gmNotes.replace('Attributes', '<br><b>Attributes </b>' );
      gmNotes = gmNotes.replace('Skills','<br><b>Skills </b>');
      gmNotes = gmNotes.replace('Edges', '<br><b>Edges </b>');
      gmNotes = gmNotes.replace('Special Abilities', '<br><b>Special Abilities </b>');
      gmNotes = gmNotes.replace('Pace', '<br><b>Pace</b>');
      gmNotes = gmNotes.replace('Gear', '<br><b>Gear </b>');
      gmNotes = gmNotes.replace('Powers', '<br><b>Powers </b>');
  
      character.set('bio', gmNotes );

      // assign token to represent character
      var charID = character.get('_id');
      token.set("represents", charID);
      
      //assign token to be default token
      // have to do this outside script for now
      setDefaultTokenForCharacter( character, token );

      // Assign all the attributes to the character sheet
      AddAttribute('AGI', dieConvert(agility), charID);
      AddAttribute('SMA', dieConvert(smarts), charID);
      AddAttribute('SPI', dieConvert(spirit), charID);
      AddAttribute('STR', dieConvert(strength), charID);
      AddAttribute('VIG', dieConvert(vigor), charID);
      AddAttribute('WildDie', wildCard || wildDie, charID);
      AddAttribute('Combat', dieConvert(combat), charID);

      AddAttribute('MeleeDam', dieConvert(melee), charID);
      AddAttribute('RangeDam', ranged, charID);
      AddAttribute('Arcane', dieConvert(arcane), charID);
      AddAttribute('Athletics', dieConvert(athletics), charID);
      AddAttribute('IntimPers', dieConvert(intimpers), charID);
      AddAttribute('Notice', dieConvert(notice), charID);
      AddAttribute('Stealth', dieConvert(stealth), charID);

      AddAttribute('_Pace', pace, charID);
      AddAttribute('_Parry', parry, charID);
      AddAttribute('_Toughness', toughness, charID);
      AddAttribute('_Armor', armor, charID);
      AddAttribute('_Size', size, charID);
      AddAttribute('InitEdges', initEdges, charID);
      AddAttribute('CombatReflex', cbtReflex, charID);
      AddAttribute('IronJaw', ironJaw, charID);

      sendChat('', '/w gm SW Statblock Import Complete');
      sendChat('', '/w gm Created: charName = [' + charName + '] Wild Card: = [' + wildCard + ']');
     
      return;
   }
});
