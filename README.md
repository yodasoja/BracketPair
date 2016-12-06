# Bracket Pair Colorizer

This extension allows matching brackets to be identified with colours. The user can define which characters to match, and which colours to use.

Screenshot:  
![Screenshot](images/example.png "Bracket Pair Colorizer")

-----------------------------------------------------------------------------------------------------------

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

> `"bracketPairColorizer.pairColors"`   
> A new bracket pair can be configured by adding it to the array.  
Here is an example for matching '<>'
````
[
    "<>",                   // Brackets to match
    [                       // CSS Color cycle
        "Gold",
        "Orchid",
        "LightSkyBlue"
    ],
    "Red"                   // Orphaned bracket color
]
````

-----------------------------------------------------------------------------------------------------------


## Release Notes

### 0.0.4

Fixed race condition causing a textEditor to be disposed while updating decoration.

### 0.0.3

Updated ReadMe  
Improved icon

### 0.0.2

Fixed an issue where timeout wasn't being disabled when set to 0

### 0.0.1

Initial release






-----------------------------------------------------------------------------------------------------------


