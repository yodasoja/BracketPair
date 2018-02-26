# Bracket Pair Colorizer

This extension allows matching brackets to be identified with colours. The user can define which characters to match, and which colours to use.

Screenshot:  
![Screenshot](images/example.png "Bracket Pair Colorizer")

-----------------------------------------------------------------------------------------------------------
## [Release Notes](CHANGELOG.md)

## Features

### User defined matching characters
> By default (), [], and {} are matched, however custom bracket characters can also be configured.

> A list of colors can be configured, as well as a specific color for orphaned brackets.

> Language support provided by Prism.js: http://prismjs.com/#languages-list
-----------------------------------------------------------------------------------------------------------

## Settings

> `"bracketPairColorizer.timeOut"`  
Configure how long the editor should be idle for before updating the document.  
Set to 0 to disable.

> `"bracketPairColorizer.forceUniqueOpeningColor"`  
![Disabled](images/forceUniqueOpeningColorDisabled.png "forceUniqueOpeningColor Disabled")
![Enabled](images/forceUniqueOpeningColorEnabled.png "forceUniqueOpeningColor Enabled")

> `"bracketPairColorizer.forceIterationColorCycle"`  
![Enabled](images/forceIterationColorCycleEnabled.png "forceIterationColorCycle Enabled")

>`"bracketPairColorizer.colorMode"`  
Consecutive brackets share a color pool for all bracket types  
Independent brackets allow each bracket type to use its own color pool  
![Consecutive](images/consecutiveExample.png "Consecutive Example")
![Independent](images/independentExample.png "Independent Example")

> `"bracketPairColorizer.highlightActiveScope"`  
Should the currently scoped brackets always be highlighted?

> `"bracketPairColorizer.bracketPairColorizer.activeScopeCSS"`  
Choose a border style to highlight the active scope. Use `{color}` to match the existing bracket color  
It is recommended to disable the inbuilt `editor.matchBrackets` setting if using this feature  
![BorderStyle](images/activeScopeBorder.png "Active Scope Border Example")  
>Tip: Add the value `"backgroundColor : {color}"` to increase visability
![BorderBackground](images/activeScopeBackground.png "Active Scope Background Example")

> `"bracketPairColorizer.consecutivePairColors"`   
> A new bracket pair can be configured by adding it to the array.  
> Note: Pair must be supported punctuation type by Prism.js  
> HTML Example:

```
[
    "</",
    ">"
],
[
    "<",
    "/>"
],
"<>",
[
    "Gold",
    "Orchid",
    "LightSkyBlue"
],
"Red"
```

> `"bracketPairColorizer.independentPairColors"`   
> A new bracket pair can be configured by adding it to the array.  
> Note: Pair must be supported punctuation type by Prism.js




