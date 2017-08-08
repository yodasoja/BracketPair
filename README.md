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

### Fast

> Bracket Pair Colorizer will only update during configurable idle time.

> Bracket Pair Colorizer will only update iterative changes to the document, caching already parsed lines.

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

>`"bracketPairColorizer.contextualParsing"`  
Contextual parsing will ignore brackets in comments or strings.  
Contextual parsing has experimental support for the following languages:  
```
- c
- clojure (partial, wip)
- cpp
- crystal
- csharp
- css
- dart
- html
- java
- javascript
- javascriptreact
- less
- php
- powershell
- python
- r
- ruby
- scss
- swift
- typescript
```

>`"bracketPairColorizer.colorMode"`  
Consecutive brackets share a color pool for all bracket types  
Independent brackets allow each bracket type to use its own color pool  
![Consecutive](images/consecutiveExample.png "Consecutive Example")
![Independent](images/independentExample.png "Independent Example")

> `"bracketPairColorizer.consecutivePairColors"`   
> A new bracket pair can be configured by adding it to the array.  
> Example for matching '<>'
>````
>[
>    "()",
>    "[]",
>    "{}",
>    "<>",                  // New bracket
>    [                      // CSS Color cycle
>        "Gold",
>        "Orchid",
>        "LightSkyBlue"
>    ],
>    "Red"                  // Orphaned bracket color
>]
>````

> `"bracketPairColorizer.independentPairColors"`   
> A new bracket pair can be configured by adding it to the array.  
> Example for matching '<>'
>````
>[
>    "<>",                   // New bracket
>    [                       // CSS Color cycle
>        "Gold",
>        "Orchid",
>        "LightSkyBlue"
>    ],
>    "Red"                   // Orphaned bracket color
>]
>````



