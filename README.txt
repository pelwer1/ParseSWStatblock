SWADE STAT BLOCK IMPORTER FOR ROLL20 API

Note this script is only useful for my custom GM setup for running SW in roll20 which does not use charater sheets.

It creates a set of Attributes with the most basic Traits that my macro's rely on
  
usage: !psb

Example Macros:

Attack
/emas Your enemy presses forward and attacks ferociously...
&{template:default}{{name=@{Div|Left}   NPC Attack!}}  {{Att:=[[ @{selected|CBT} + ?{Mods|0} ]]  **Frz:** [[ @{selected|CBT} + ?{Mods|0} ]] **Arc:**[[ @{selected|ARC} + ?{Mods|0} ]]  (**W**[[ ?{Enter 1 for Wild Die|0}*d6! + ?{Enter 1 for Wild Die|0}*?{Mods|0}]]) }}
Damage
/emas Your enemy strikes with terrifying force and accuracy... 
&{template:default}{{name=@{Div|Left}   NPC Damage}}{{**Melee:**=[[ @{selected|STR} + @{selected|MDM}  ]]  **Range:** [[ @{selected|RDM}  ]] (**Raise!** [[ d6!  ]])   }}

Trait Roll
/emas Your enemy attempts to use their traits to seize advantage...
&{template:default}{{name=@{Div|Left} NPC Trait Check}}  {{ AGI: [[ @{selected|AGI} + ?{Mods|0} ]] = Athletics: [[ @{selected|ATH} + ?{Mods|0} ]] }}  {{ SMA: [[ @{selected|SMA} + ?{Mods|0} ]] = Heal, Lor, Rep, Surv: [[ @{selected|SMA} + ?{Mods|0} ]]   }}  {{ SPI: [[ @{selected|SPI} + ?{Mods|0} ]] = Intim, Pers, Taunt: [[ @{selected|SOC} + ?{Mods|0} ]] }}  {{ STR: [[ @{selected|STR} + ?{Mods|0} ]] = Notice: [[ @{selected|NOT} + ?{Mods|0} ]] }}  {{ VIG: [[ @{selected|VIG} + ?{Mods|0} ]] = Thievery, Vehicles: [[ @{selected|AGI} + ?{Mods|0} ]] }}  {{   ***Wild Die***   = [[ ?{Enter 1 for Wild Die|0}*d6! + ?{Enter 1 for Wild Die|0}*?{Mods|0}]] }}

Un Shake/Soak
/emas Your enemy attempts to clear his head and re-join the fight!
&{template:default}{{name=@{Div|Left} NPC UnShake or Soak}}  {{Shake=[[ @{selected|SPI} + 2*@{selected|CBR}  ]]  (**W**[[ ?{Enter 1 for Wild Die|0}*d6! + ?{Enter 1 for Wild Die|0}*2*@{selected|CBR} ]])  ||** Soak**[[ @{selected|VIG} + 2*@{selected|IRJ} ]]  (**W**[[ ?{Enter 1 for Wild Die|0}*d6! + ?{Enter 1 for Wild Die|0}*2*@{selected|IRJ} ]]) }} }}


