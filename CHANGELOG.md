## Release Notes

### 0.8.0
The following settings were tightly coupled, so have been combined into one setting:
Removed `"bracketPairColorizer.colorizeQuotes"` setting  
Removed `"bracketPairColorizer.colorizeComments"` setting

Added `bracketPairColorizer.contextualParsing` setting

Contextual parsing will ignore brackets in comments or strings.

Contextual parsing has experimental support for the following languages:  
- c  
- cpp  
- csharp  
- java  
- php  
- ruby  
- r

### 0.7.5
Added experimental support for python comments in python files

### 0.7.4
Fix multiple character escapes not being captured

### 0.7.3
Fix quotes in comments and vice versa breaking bracket coloring

### 0.7.2
Fix multiline comments breaking bracket coloring

### 0.7.1
Added backticks `` ` `` as quote modifier

### 0.7.0
Ignore brackets in quotes by default  
Added `"bracketPairColorizer.colorizeQuotes"` setting to toggle

### 0.6.2
Performance improvements due to reduced string copying

### 0.6.1
Second attempt at adding support for multiline comments

### 0.6
Rollback to equivalent of 0.5.0 because comments broke 

### 0.5.1
Added support for multiline comments

### 0.5.0
Ignore brackets in comments by default  
Added `"bracketPairColorizer.colorizeComments"` setting to toggle

### 0.4.0
Fix an error where editor.document can return undefined

### 0.3.2
Fix an error where active editor may be undefined at startup

### 0.3.1
Internal logic cleanup  
Markdown cleanup

### 0.3.0
Fix colorizing all editors, including terminals. Now it will only colorize documents.

### 0.2.1
forceUniqueOpeningColor now works with independent color pools  
forceIterationColorCycle now works with independent color pools  

### 0.2.0
Added forceUniqueOpeningColor  
Added forceIterationColorCycle

### 0.1.1
Prevent opening brackets having same color as previous closing bracket in consecutive mode

### 0.1.0
Added consecutive bracket coloring

### 0.0.4

Fixed race condition causing a textEditor to be disposed while updating decoration.

### 0.0.3

Updated ReadMe  
Improved icon

### 0.0.2

Fixed an issue where timeout wasn't being disabled when set to 0

### 0.0.1

Initial release



