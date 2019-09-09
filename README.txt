SWADE STAT BLOCK IMPORTER FOR ROLL20 API
 Original Author Jason.P 18/1/2015 - ported from Version 2.25
 Thread: https://app.roll20.net/forum/post/1517881/pathfinder-statblock-import-to-character-sheet-script/?pagenum=2

 pelwer - 12/28/18 
	Hacked to parse swade stat block from pdf
 pelwer - 9/8/19
   Upgraded the parser based on post from Aaron
   https://wiki.roll20.net/API:Cookbook#decodeEditorText
	
	INSTRUCTIONS
	1. Find yourself a SW stat-block (doesn't have to be SWADE, SWD version works fine too)
	2. Copy the stat block from *Name* on down
   2.2 Paste into a plain text editor. 
   2.4 Prepend [WC!] in first column of first line to make the creature a wildcard
   2.6 Select and copy the text again
	3. Paste the stat block into the GM Notes Section of a token in your roll20 campaign.
	4. Select the token 
  5. In the chat box, type the command "!SW-Import".
  
  
