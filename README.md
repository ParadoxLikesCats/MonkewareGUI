# MonkewareGUI
## Please don't use this! Scaling is done very sloppily - Once I have time I'll recode this with scaling in mind at the very start...
### Features
* Full localstorage config system 
  * Creating - Creates a new config
  * Deleting - Deletes currently selected config
  * Saving - Saves currently selected config
  * Loading - Loads currently selected config
  * Importing - Imports config from clipboard (Requires permissions)
  * Exporting - Exports config to clipboard

* Custom elements
  * Slider `createSlider(label, configKey, min, max, step)` - Creates a slider/range
  * Toggle `createToggle(label, configKey)` - Creates a toggle/checkbox
  * Dropdown Select `createSelect(label, options, configKey)` - Creates a dropdown select. Only one option can be picked at a time.
  * Keybind `createKeybind(label, configKey)` - Creates a keybind. Is assigned the first key you press after clicking on the element.
  * Input `createInput(label, configKey)` - Creates a text input.
  * Colorpicker `createColorpicker(label, configKey)` - Creates a colorpicker.
  * Button `createButton(label, callback)` - Creates a button which runs callback on click. **(IN BETA, MAY BE BUGGY)**

* Custom menu elements
  * Tab `createTabContent(index, callback)` - Creates base tab then runs the callback.
  * Section `createSection(label, callback)` - Creates a section then runs the callback.
  * Config Container `createConfigContainer()` - Creates the config container with the functionality listed above. 
  * Color Theme `createColorpicker("Color Theme", "colTheme", true)` - Creates a colorpicker that updates global "colTheme", which changes the colortheme of the menu.
  * Monkeys from Runescape - Random monkey logo from osrs, lol.
  * Event Logging `createEvent(text, type, waitTime)` - Color based event logs that slides up and fades await after waiting `waitTime`.

### Example
```javascript
var globalObject = {};

const gui = createGUI({
    config: globalObject,
    tabs: ["Example", "Config"]
});

gui.createMenu(()=>{
    gui.createTabContent(0, () => {
        gui.createSection("Example Section", () => {
            gui.createSlider("Slider", "example.slider", 0, 100, 1);
            gui.createToggle("Toggle", "example.toggle");
            gui.createButton("Button", `alert('Example callback')`);
            gui.createSelect("Select", [
                "Option 1",
                "Option 2",
                "Option 3"
            ], "example.select");
            gui.createKeybind("Keybind", "example.keybind");
            gui.createInput("Input", "example.input");
            gui.createColorpicker("Colorpicker", "example.colorpicker");
        })
        gui.createSection("Example Section 2", () => {
        })
        gui.createSection("Example Section 3", () => {
           
        })
    })
    gui.createTabContent(1, () => {
        gui.createSection("Config", () => {
            gui.createConfigContainer();
        })
    })
})
```
Output: https://gui.sedated.repl.co/

This is my first project written in Javascript. It may be pretty messy.
