// SWADE STAT BLOCK IMPORTER FOR ROLL20 API
//  Original Author Jason.P 18/1/2015 - ported from Version 2.25
//  Thread: https://app.roll20.net/forum/post/1517881/pathfinder-statblock-import-to-character-sheet-script/?pagenum=2
//
//  pelwer - 12/28/18 
// 	Hacked to parse swade stat block from pdf
// 	
// 	INSTRUCTIONS
// 	1. Find yourself a SW stat-block
// 	2. Copy the stat block from *Name* on down
// 	3. Paste the stat block into the GM Notes Section of a token in your roll20 campaign.
// 	4. Select the token 
//    5. In the chat box, type the command "!SW-Import".
// 
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

//     AddAttribute("size",sizeNum,charID);
// var AddAttribute = AddAttribute || {};  // needed?
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
      sendChat("", "Attribute: Value = " + attr + ": " + value);
   }
   return;
}
// // function that adds the various abilities
// // addAbility(attackName[1]+"-DMG", abilityDamageString, charID);
// 
// var AddAbility = AddAbility || {};
// function addAbility(ability, text, charID) {
// createObj("ability", {
//                 name: ability,
//                 description: "",
//                 action: text,
//                 istokenaction: true,
//                 characterid: charID
//             });
// }   

//                            / \ / [ ] ( ) { } ? + * | . ^ $ 
var RegExpEscapeSpecial = /([\/\\\/\[\]\(\)\{\}\?\+\*\|\.\^\$])/g;

// string search and replace insitu
// e.g.  gmNotes = stripString(gmNotes, "%3C/h1%3E", "%3Cbr");
// search-in-string.replace( searchforvalue, replacewithnewvalue)
// str = searchIn; removeStr = searchFor;  replaceWith = replaceWith                     
function stripString(str, removeStr, replaceWith) {
   var r = new RegExp(removeStr.replace(RegExpEscapeSpecial, "\\$1"), 'g');
   return str.replace(r, replaceWith);
}

/* Deletes any characters between the character a and b in incstr */
function stripStringRegEx(incstr, a, b) {
   var ea = a.replace(RegExpEscapeSpecial, "\\$1"),
      eb = b.replace(RegExpEscapeSpecial, "\\$1"),
      r = new RegExp(ea + '.*?' + eb, 'g');
   return incstr.replace(r, '');
}

/*Cleans up the string leaving text and hyperlinks */
function cleanUpString(strSpecials) {
   strSpecials = stripString(strSpecials, "%20", " ");
   strSpecials = stripString(strSpecials, "%22", "\"");
   strSpecials = stripString(strSpecials, "%29", ")");
   strSpecials = stripString(strSpecials, "%28", "(");
   strSpecials = stripString(strSpecials, "%2C", ",");
   strSpecials = stripString(strSpecials, "%3C", "<");
   strSpecials = stripString(strSpecials, "%3E", ">");
   strSpecials = stripString(strSpecials, "%23", "#");
   strSpecials = stripString(strSpecials, "%3A", ":");
   strSpecials = stripString(strSpecials, "%3B", ",");
   strSpecials = stripString(strSpecials, "%3D", "=");

   strSpecials = stripString(strSpecials, "</strong>", "");
   strSpecials = stripString(strSpecials, "<strong>", "");
   strSpecials = stripString(strSpecials, "</em>", "");
   strSpecials = stripString(strSpecials, "<em>", "");
   strSpecials = stripString(strSpecials, "%u2013", "-");
   strSpecials = stripStringRegEx(strSpecials, "<b", ">");
   strSpecials = stripString(strSpecials, "</b>", "");
   strSpecials = stripStringRegEx(strSpecials, "<h", ">");
   strSpecials = stripStringRegEx(strSpecials, "</h", ">");

   strSpecials = stripString(strSpecials, "</a>", "");

   strSpecials = stripStringRegEx(strSpecials, "<t", ">");
   strSpecials = stripStringRegEx(strSpecials, "</t", ">");
   strSpecials = stripString(strSpecials, "%20", " ");
   strSpecials = stripString(strSpecials, "%22", "\"");
   strSpecials = stripString(strSpecials, "%29", ")");
   strSpecials = stripString(strSpecials, "%28", "(");
   strSpecials = stripString(strSpecials, "%2C", ",");
   strSpecials = stripString(strSpecials, "%u201C", "");
   strSpecials = stripString(strSpecials, "%u201D", "");
   strSpecials = stripString(strSpecials, "%26amp,", "and");

   strSpecials = stripString(strSpecials, "p1\">", "");
   strSpecials = stripString(strSpecials, "s1\">", "");
   strSpecials = stripString(strSpecials, "p2\">", "");
   strSpecials = stripString(strSpecials, "p[0-9]\">", "");

   while (strSpecials.search(/%../) != -1) {
      strSpecials = strSpecials.replace(/%../, "");
   }

   return strSpecials;
}

/* Deletes the links from the string str */
function removeLinks(str) {
   return stripStringRegEx(str, "<", ">");
}

// For checking if a string is empty, null or undefined I use:
function isEmpty(str) {
   return (!str || 0 === str.length);
}
//For checking if a string is blank, null or undefined I use:
function isBlank(str) {
   return (!str || /^\s*$/.test(str));
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

// need to learn why this didn't work
// var athletics = 'd' + getSkillDie( gmNotes, 'Athletics');
// sendChat("","Function Athletics: " + athletics);

// search text for skill name and return die value
function getSkillDie(searchIn, forSkill) {
   var reggie = new RegExp(forSkill + '\s+d(\d+)', '');
   if (reggie.test(searchIn)) {
      return searchIn.match(reggie)[1];
   }
   else {
      return "4";
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
      var verboseMode = 1;

      // get notes from token
      var originalGmNotes = token.get('gmnotes');
      var gmNotes = token.get('gmnotes');
      if (!gmNotes) {
         sendChat("ERROR", "GM Notes is empty.");
         return;
      }
      // sendChat("","raw gmNotes = [" + gmNotes + "]" );

      // strip out html tags:  myString.replace(/<(?:.|\n)*?>/gm, '');
      // gmNotes = gmNotes.replace(/<(?:.|\n)*?>/gm, '');
      // sendChat("","after 2nd replace gmNotes = [" + gmNotes + "]" );
      
      
      // this is the winner !!  put what you want to keep in the regex
      // gmNotes = gmNotes.replace(/[^a-zA-Z0-9()<\/>+:, ]/g, '');
      // sendChat("","after 1st replace gmNotes = [" + gmNotes + "]" );
      

      
      //strip html junk from gmNotes that roll20 stores text block
      gmNotes = stripString(gmNotes, "%3C/table%3E", "%3Cbr");
      gmNotes = stripString(gmNotes, "%3C/h1%3E", "%3Cbr");
      gmNotes = stripString(gmNotes, "%3C/h2%3E", "%3Cbr");
      gmNotes = stripString(gmNotes, "%3C/h3%3E", "%3Cbr");
      gmNotes = stripString(gmNotes, "%3C/h4%3E", "%3Cbr");

      // sendChat("","some cleaning  gmNotes = [" + gmNotes + "]" );
      // return;

      //break the string down by line returns
      var data = gmNotes.split("userscript-");
      // check the data looks right
      // sendChat("","data2 = [" + data[2] + "]" );
      //  return;

      //clean any characters excepting text and hyperlinks
      var charNameLine = "";
      var charName = "";
      var wildCard = 0;
      var skipLoop = 0;
      for (var i = 0; i < data.length; i++) {
         data[i] = cleanUpString(data[i]);
         data[i] = removeLinks(data[i]);
         data[i] = data[i].trim();
         // grab the first line with text
         if (/[A-Z]+/.test(data[i]) && !skipLoop) {
            // sendChat("","got here 8 - data[i]:  i = " + i + " [" + data[i].length + "]" );
            // sendChat("","[" + data[i][0] + data[i][1] + data[i][2] + data[i][3] + "]" );
            skipLoop = 1;
            charNameLine = data[i];

            // the wildcard symbol in the SWADE PDF translates to "DD" in GM Notes after all the string stripping
            if (charNameLine.match(/^DD/)) {
               wildCard = 1;
            }

            // get the name of the monster to build the journal entry
            if (wildCard) {
               charName = charNameLine.match(/^DD(.*)/)[1];
            }
            else {
               charName = charNameLine.match(/^(.*)/)[1];
            }
            charName = charName.replace(/p class/g, '');
            charName = charName.replace(/[^a-zA-Z0-9()+:, ]/g, '');
            charName = charName.trim();

            // get rid of all new lines
            // charName = charName.replace(/[\n\r]+/g, "");
            // If you want to remove all control characters, including CR and LF, you can use this:
            // charName = charName.replace(/[^\x20-\x7E]/gmi, "");
         }
      }
      if (verboseMode) {
         sendChat('', 'charName = [' + charName + ']');
         sendChat("", "Wild Card: = [" + wildCard + "]");
      }

      // get GM Notes into a single long string for regex parsing
      gmNotes = stripString(gmNotes, "%3C", "<");
      gmNotes = stripString(gmNotes, "%3E", ">");
      gmNotes = stripString(gmNotes, "%23", "#");
      gmNotes = stripString(gmNotes, "%3A", ":");
      gmNotes = stripString(gmNotes, "%3B", ",");
      gmNotes = stripString(gmNotes, "%3D", "=");
      gmNotes = stripString(gmNotes, "</strong>", "");
      gmNotes = stripString(gmNotes, "<strong>", "");
      gmNotes = stripString(gmNotes, "</em>", "");
      gmNotes = stripString(gmNotes, "<em>", "");
      gmNotes = stripString(gmNotes, "%u2013", "-");
      gmNotes = stripStringRegEx(gmNotes, "<b", ">");
      gmNotes = stripString(gmNotes, "</b>", "");
      gmNotes = stripStringRegEx(gmNotes, "<h", ">");
      gmNotes = stripStringRegEx(gmNotes, "</h", ">");
      gmNotes = stripString(gmNotes, "</a>", "");
      gmNotes = stripStringRegEx(gmNotes, "<t", ">");
      gmNotes = stripStringRegEx(gmNotes, "</t", ">");
      gmNotes = stripString(gmNotes, "%20", " ");
      gmNotes = stripString(gmNotes, "%22", "\"");
      gmNotes = stripString(gmNotes, "%29", ")");
      gmNotes = stripString(gmNotes, "%28", "(");
      gmNotes = stripString(gmNotes, "%2C", ",");
      gmNotes = stripString(gmNotes, "%27", "'");
      gmNotes = stripString(gmNotes, "%u2019", "'");
      gmNotes = stripString(gmNotes, "%u201C", " ");
      gmNotes = stripString(gmNotes, "%u2022", " ");
      gmNotes = stripString(gmNotes, "%u2014", " ");
      gmNotes = stripString(gmNotes, "%84", " ");
      gmNotes = stripString(gmNotes, "%0A", " ");
      gmNotes = stripString(gmNotes, "%26nbsp,", " ");
      gmNotes = stripString(gmNotes, "%u201D", " ");    
      gmNotes = stripString(gmNotes, "%26amp,", "and");

      // sendChat("","x gmNotes = [" + gmNotes + "]" );
      // return;
      
      // done with all the substitutions, delete all the other codes
      while (gmNotes.search(/%../) != -1) {
         gmNotes = gmNotes.replace(/%../, "");
      }

      // This javascript replaces all 3 types of line breaks with a space
      // This makes gmNotes 1 line of text
      gmNotes = gmNotes.replace(/([\r\n]+)/gm, " ");

      //Replace all double white spaces with single spaces
      gmNotes = gmNotes.replace(/\s+/g, ' ');

      // this is the winner !!
      gmNotes = gmNotes.replace(/[^a-zA-Z0-9()\+:,\'\. ]/g, '');

      gmNotes = gmNotes.replace(/span classuserscripts1/g, ' ');
      gmNotes = gmNotes.replace(/span classuserscripts2/g, ' ');
      gmNotes = gmNotes.replace(/span classuserscripts3/g, ' ');
      gmNotes = gmNotes.replace(/span classuserscripts4/g, ' ');

      gmNotes = gmNotes.replace(/pp classuserscriptp1/g, ' ');
      gmNotes = gmNotes.replace(/pp classuserscriptp2/g, ' ');
      gmNotes = gmNotes.replace(/pp classuserscriptp3/g, ' ');
      gmNotes = gmNotes.replace(/pp classuserscriptp4/g, ' ');
 
      gmNotes = gmNotes.replace(/p classuserscriptp1/g, ' ');
      gmNotes = gmNotes.replace(/spanspan/g, ' ');
      gmNotes = gmNotes.replace(/span span/g, ' ');
      
      gmNotes = gmNotes.trim();

      // If you want to remove all control characters, including CR and LF, you can use this:
      gmNotes = gmNotes.replace(/[^\x20-\x7E]/gmi, "");

      // check the cleanup
      if (verboseMode) {
         sendChat("", "clean gmNotes in 1 line = [" + gmNotes + "]");
      }
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
      if (/[Spellcasting|Focus|Faith|Psionics|Weird Science]\s+(d\d+\+?\d*)/.test(gmNotes)) {
         arcane = gmNotes.match(/[Spellcasting|Focus|Faith|Psionics|Weird Science]\s+(d\d+\+?\d*)/)[1];
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
      if (/Edges:.*Quick/.test(gmNotes)) {
         initEdges = initEdges + 'Qui,';
      }
      if (/Edges:.*Improved Level Headed/.test(gmNotes)) {
         initEdges = initEdges + 'ILH,';
      }
      if (/Edges:.*Level Headed/.test(gmNotes)) {
         initEdges = initEdges + 'LH,';
      }
      if (/Edges:.*Tactician/.test(gmNotes)) {
         initEdges = initEdges + 'TT,';
      }
      if (/Edges:.*Master Tactician/.test(gmNotes)) {
         initEdges = initEdges + 'MTT,';
      }
      if (/Edges:.*Mighty Blow/.test(gmNotes)) {
         initEdges = initEdges + 'WCE,';
      }
      if (/Edges:.*Dead Shot/.test(gmNotes)) {
         initEdges = initEdges + 'WCE,';
      }
      if (/Edges:.*Combat Reflex/.test(gmNotes)) {
         cbtReflex = '1';
      }
      if (/Edges:.*Iron Jaw/.test(gmNotes)) {
         ironJaw = '1';
      }


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
      //  Name p/p/t(a)[s]@  = Name pace/parry/toughness(armor){size}@ (if WildCard)
      var tokenName = charName + " " + pace + "/" + parry + "/" + toughness + "(" + armor + "){" + size + "}";
      if (wildCard) {
         tokenName = tokenName + "@";
      }
      sendChat("", "token name: " + tokenName);
      token.set("name", tokenName);
      token.set("showname", true);
      token.set("showplayers_name", false);
      
      //Create character entry in journal, token image = avatar image
      var character = createObj("character", {
         avatar: token.get("imgsrc"),
         name: charName,
         archived: false
      });

      gmNotes = gmNotes.replace(/DDspan/g, '[Wild Card!] ');
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
      AddAttribute('WildDie', wildCard, charID);
      AddAttribute('Combat', dieConvert(combat), charID);

      AddAttribute('MeleeDam', dieConvert(melee), charID);
      AddAttribute('RangeDam', ranged, charID);
      AddAttribute('Arcane', dieConvert(arcane), charID);
      AddAttribute('Athletics', dieConvert(athletics), charID);
      AddAttribute('IntimPers', dieConvert(intimpers), charID);
      AddAttribute('Notice', dieConvert(notice), charID);
      AddAttribute('Stealth', dieConvert(stealth), charID);

      AddAttribute('Pace', pace, charID);
      AddAttribute('Parry', parry, charID);
      AddAttribute('Toughness', toughness, charID);
      AddAttribute('Armor', armor, charID);
      AddAttribute('Size', size, charID);
      AddAttribute('InitEdges', initEdges, charID);
      AddAttribute('CombatReflex', cbtReflex, charID);
      AddAttribute('IronJaw', ironJaw, charID);

      return;
   }
});
