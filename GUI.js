/*
Config layout...

{
    "config_name": {
        
    } -> {} is stringified and encoded in base64 
    <-- Load proc -->
        (1) JSON.parse (entire config)
        (2) atob(current config);
        (3) JSON.parse (current config)
}

*/
function createGUI(options = {}) {
    let windowKey = "KEY"; // Name of the property in the window
    let globalKey; // Makes "this" useable globally
    class SedatedGUI {
        constructor(options = {}) {
            globalKey = this;
            // CURRENT CONFIG SHOULD BE READABLE. DO NOT ENCODE.
            this.config = options.config || {};
            // All configs doesn't have to be 100% parsed and readable (to the user). Instead, config values can be encoded in base64 format which can be decoded later.
            this.allConfigs = options.allConfigs || {};
            this.tabs = options.tabs || ["Tab"] 
            this.menu = {
                content: "",
                built: false
            };
            this.menuGlobals = {
                colTheme: "#fa192f"
            }
            this.menuData = {
                currentTab: this.tabs[0],
                currentConfig: false,
                currentlyKeybinding: false,
                currentEventID: 0,
                rebuildFunc: null,
                monkeys: ["maniac_monkey", "monkey_archer_ninja", "monkey_aunt", "monkey_child", "monkey_corpse", "monkey_guard", "monkey_head", "monkey_item_face", "monkey_king", "monkey_ninja", "monkey_uncle", "monkey_zombie", "monkey", "reanimated_monkey", "sleeping_monkey", "stuffed_monkey"]
            };
            try {
                this.onLoad();
            } catch (err) {
                console.error("Error on load: " + err.stack);
            }
        }
        mkDefault = (key, def) => this.config[key] = this.config[key] ?? def;
        // This is used to VERIFY localStorage objects ONLY ON LOAD to prevent null / undefined
        getStorageObj(key, fallbackValue) {
            // Values should consistently be objects. 
            let value = JSON.parse(localStorage.getItem(key));
            if (value == undefined || value == null) {
                localStorage.setItem(key, JSON.stringify(fallbackValue || {}));
                return fallbackValue || {};
            } else {
                return value;
            }
        }
        baseAllKeys(object) {
            return Object.keys(object).reduce(
                (attrs, key) => ({
                    ...attrs,
                    [key]: btoa(JSON.stringify(object[key])),
                }), {}
            );
        }
        createConfig() {
            /*
                <-- Config creating process -->
                (1) Get name of currently selected config
                (2) Create config locally
                (3) Deep clone local config object
                (4) Turn config to base64 and stringify object
                (5) Save to local storage
            */
            if (!this.menuData.currentConfig) {
                let configName = $("#cheatConfigInput").val();
                if (!(configName in this.allConfigs) && configName) {
                    this.allConfigs[configName] = btoa(JSON.stringify({}));
                    localStorage.setItem("cheat_configs", JSON.stringify(this.allConfigs));
                    $("#cheatConfigInput").val("");
                    this.createEvent(`Created config "${configName}"`, "success");
                    this.refreshConfigs();
                } else {
                    this.createEvent(`Error creating config: invalid name`, "error");
                }
            }
        }
        importConfig() {
            navigator.clipboard.readText().then(text => {
                // There is a need to implement checks here as users cause errors
                let config = text;
                try {
                    config = atob(config); // decode
                } catch (err) {
                    this.createEvent(`Error importing config: invalid base64`, "error")
                    return; // Exit. User messed it up!
                }
                try {
                    config = JSON.parse(config); // parse
                } catch (err) {
                    this.createEvent(`Error importing config: invalid JSON`, "error")
                    return; // Exit. User messed it up!
                }
                if (config.name && !(config.name in this.allConfigs)) {
                    this.allConfigs[config.name] = config.value;
                    localStorage.setItem("cheat_configs", JSON.stringify(this.allConfigs));
                    this.refreshConfigs();
                    this.createEvent(`Imported config "${config.name}"`, "success");
                } else {
                    this.createEvent("Error importing config: invalid/existing name", "error");
                }
            }).catch(err => {
                this.createEvent("Error importing config: " + err.name, "error");
            });
        }
        exportConfig() {
            /* 
                Exported value should be the base64 of {key : [name of config], value : [value of config]}
                Slightly different (entire object should be encoded)
                <-- Config export process -->
                (1) Create config object based on local configs
                (2) Stringify value
                (3) Encode value to base64
                (4) Push to clipboard

                config is base64 -> stringifed -> stringified
            */
            if (!this.menuData.currentConfig || !(this.menuData.currentConfig in this.allConfigs)) return;
            try {
                let config = btoa(JSON.stringify({
                    name: this.menuData.currentConfig,
                    value: this.allConfigs[this.menuData.currentConfig]
                }))
                navigator.clipboard.writeText(config).then(() => {
                    this.createEvent(`Exported config "${this.menuData.currentConfig}"`, "success");
                }).catch(err => {
                    this.createEvent("Error exporting config to clipboard: " + err.name, "error");
                });
            } catch (err) {
                this.createEvent("Error exporting config to clipboard", "error");
            }
        }
        deleteConfig(element) {
            /*
                Write a confirmation system (FINISHED)
            */
            if (!this.menuData.currentConfig || !(this.menuData.currentConfig in this.allConfigs)) return;
            $(element).text("Confirm");
            document.addEventListener("mousedown", function listen(event) {
                $(element).text("Delete"); // Reset text
                if ($(event.target).attr("id") === $(element).attr("id")) {
                    delete globalKey.allConfigs[globalKey.menuData.currentConfig];
                    globalKey.createEvent(`Deleted config "${globalKey.menuData.currentConfig}"`, "success");
                    localStorage.setItem("cheat_configs", JSON.stringify(globalKey.allConfigs));
                    globalKey.menuData.currentConfig = false;
                    globalKey.refreshConfigs();
                }
                this.removeEventListener("mousedown", listen);
            })
        }
        loadConfig() {
            /*
                <-- Config loading process -->
                (1) Get all configs from localStorage
                (2) Parse string to JSON
                (3) Get current config relative to parsed object
                (4) Unencode current config from base64 to an object
                (5) Parse string to JSON (relative to current config)
                (6) Load config
            */
            if (!this.menuData.currentConfig) return;
            let currentStoredConfig = JSON.parse(
                atob(
                    JSON.parse(localStorage.getItem("cheat_configs"))[this.menuData.currentConfig]
                )
            );
            if (currentStoredConfig) {
                if (Object.keys(currentStoredConfig).length <= 0) {
                    this.createEvent("Error loading config: empty slot selected", "error");
                } else {
                    Object.keys(currentStoredConfig).forEach(key => {
                        // Possibly implement checks in future to prevent errors
                        this.config[key] = currentStoredConfig[key];
                    });
                    localStorage.setItem("default_cheat_config", JSON.stringify(this.config));
                    this.createEvent(`Loaded config "${this.menuData.currentConfig}"`, "success");
                    this.refreshConfigs();
                }
            } else {
                this.createEvent("Error loading config: invalid slot selected", "error");
            }
        }
        saveConfig() {
            if (this.menuData.currentConfig in this.allConfigs) {
                this.allConfigs[this.menuData.currentConfig] = btoa(JSON.stringify(this.config));
                localStorage.setItem("cheat_configs", JSON.stringify(this.allConfigs));
                this.createEvent(`Saved config "${this.menuData.currentConfig}"`, "success");
            } else {
                this.createEvent("Error saving config: invalid slot selected", "error")
            }
        }
        refreshConfigs() {
            this.refreshMenu(true);
            $("#cheatConfigs").empty();
            Object.keys(this.allConfigs).forEach(configName => {
                $("#cheatConfigs").append(`<div class="${configName == this.menuData.currentConfig ? "selected" : ""}" onclick="${windowKey}.checkConfigSlot(this)">${configName}</div>`);
            })
            this.refreshConfigButtons();
        }
        refreshConfigButtons() {
            $($(".cheatConfigButton"), $(".configButtons")).each(function() {
                if (globalKey.menuData.currentConfig) {
                    $("#configSelectedShow").show();
                    $("#configSelectedHide").hide();
                } else {
                    $("#configSelectedHide").show();
                    $("#configSelectedShow").hide();
                }
            })
        }
        refreshMenu(fullRefresh = false) {
            // Refresh color theme
            document.documentElement.style.cssText = `--main-col: ${this.menuGlobals.colTheme}`;
            localStorage.setItem("cheat_globals", JSON.stringify(this.menuGlobals));
            if (fullRefresh) {
                this.menu.content = "";
                this.menuData.buildFunc()
                $("#cheatMenuContentHolder").empty();
                $("#cheatMenuContentHolder").append(this.menu.content);
            }
        }
        onLoad() {
            $('head').append('<link rel="stylesheet" href="https://GUI.sedated.repl.co/new.css">');
            this.menuGlobals = this.getStorageObj("cheat_globals", this.menuGlobals);
            this.config = this.getStorageObj("default_cheat_config");
            this.allConfigs = this.getStorageObj("cheat_configs");
            this.refreshMenu();
        }
        makeDraggable() {
            // Credit W3Schools. (jQuery UI is a pain)
            var divId = "cheatMenu",
                rep = "x";

            function dragElement(n) {
                var t = 0,
                    o = 0,
                    l = 0,
                    u = 0;

                function e(e) {
                    // Prevent overriding inputs (makes it so it can't be selected!)
                    ["INPUT", "SPAN", "SELECT"].includes(e.srcElement.nodeName) || (e.target, (e = e || window.event).preventDefault(), l = e.clientX, u = e.clientY, document.onmouseup = c, document.onmousemove = d)
                }

                function d(e) {
                    (e = e || window.event).preventDefault(), t = l - e.clientX, o = u - e.clientY, l = e.clientX, u = e.clientY, n.style.top = n.offsetTop - o + "px", n.style.left = n.offsetLeft - t + "px"
                }

                function c() {
                    document.onmouseup = null, document.onmousemove = null
                }
                document.getElementById(n.id + rep) ? document.getElementById(n.id + rep).onmousedown = e : n.onmousedown = e
            }
            dragElement(document.getElementById(divId));
        }
        updateConfig(key, value, slider = false, global = false) {
            if (slider) document.getElementById("slider-" + slider).innerHTML = value; // Some issues here with jQuery.
            if (global) {
                this.menuGlobals[key] = value;
                this.refreshMenu();
            } else {
                this.config[key] = value;
                localStorage.setItem("default_cheat_config", JSON.stringify(this.config));
            }
        }
        updateKeybind(configKey, element) {
            let previousValue = $(element).text();
            $(element).text("...");
            this.menuData.currentlyKeybinding = true;
            document.addEventListener("keydown", function listen(event) {
                if (["Backspace", "Escape"].includes(event.code)) {
                    globalKey.updateConfig(configKey, false); // Deletes the value
                } else if (["ShiftRight", "Insert"].includes(event.code)) {
                    globalKey.updateConfig(configKey, previousValue); // Fallback to previous value (menu closed)
                } else {
                    let nKey = {
                        "Space": "space", // Key prop evals to "" 
                        "Backspace": "delete"
                    } [event.code] ?? event["key"].toLowerCase(); // Prevent funky looking overflows
                    globalKey.updateConfig(configKey, nKey);
                }
                setTimeout(() => {
                    globalKey.menuData.currentlyKeybinding = false; // Prevent closing menu while keybinding
                }, 100)
                $(element).text(globalKey.config[configKey] || "none");
                this.removeEventListener("keydown", listen);
            })
        }
        getRandomMonkey() {
            // Returns a random monkey from runescape as a png.
            // Just a random joke feature I felt like implementing 
            return "https://GUI.sedated.repl.co/runescape/" + this.menuData.monkeys[Math.floor(Math.random() * this.menuData.monkeys.length)] + ".png"
        }
        createMenu(callback) {
            // Create menu skeleton
            // No overlay version:
            // <div id="cheatEventHolder"></div><div id="cheatMenu"><div id="cheatMenuHeader"><img id = "cheatLogoImg" src="https://GUI.sedated.repl.co/logo.svg" width="50px" height="50px"><p id = "cheatLogoName">monke<a id = "cheatThemeColored">ware</a></p><ul id="cheatTabHolder"> </ul> </div><div id="cheatMenuContentHolder"></div></div>

            // https://GUI.sedated.repl.co/logo.svg
            $("body").append(`<div id="cheatEventHolder"></div><div id="cheatOverlay"><div id="cheatMenu"><div id="cheatMenuHeader"><img id = "cheatLogoImg" src="${this.getRandomMonkey()}" height="50px"><p id = "cheatLogoName">monke<a id = "cheatThemeColored">ware</a></p><ul id="cheatTabHolder"> </ul> </div><div id="cheatMenuContentHolder"></div></div></div>`);
            this.tabs.forEach(tab => {
                let active = (tab == this.menuData.currentTab ? "active" : "");
                $("#cheatTabHolder").append(`<li class = "cheatTab ${active}" onclick="${windowKey}.switchTabs(this)" tab="tab-${tab}">${tab}</li>`)
            })
            callback();
            $("#cheatMenuContentHolder").append(
                this.menu.content
            ).hide().fadeIn("slow");
            this.makeDraggable();
            this.createKeybinding();
            this.menuData.buildFunc = callback;
        }
        switchTabs(element) {
            // jQuery causes issues with switching tabs that have spaces.
            let curTabName = $(element).attr("tab");
            $("#cheatTabHolder li").removeClass("active");
            $(".cheatTabContent").removeClass("active");
            $(element).addClass("active");
            $("#" + curTabName).addClass("active");
            this.menuData.currentTab = $(element).text();
        }
        checkConfigSlot(element) {
            let className = "selected"
            if ($(element).hasClass(className)) {
                $(element).removeClass(className);
                this.menuData.currentConfig = false;
            } else {
                $("#cheatConfigs>div.selected").removeClass(className);
                $(element).addClass(className);
                this.menuData.currentConfig = $(element).text();
            }
            this.refreshConfigButtons();
        }
        createConfigContainer() {
            this.menu.content += `<div id="cheatConfigContainer"> <div id="cheatConfigs">`
            Object.keys(this.allConfigs).forEach(cfg => {
                this.menu.content += `<div onclick="${windowKey}.checkConfigSlot(this)">${cfg}</div>`;
            })
            this.menu.content += "</div></div>";
            this.menu.content += `<input autocomplete = "off" id = "cheatConfigInput" type="text">`
            this.menu.content += `<div class="cheatConfigButtons"><div id="configSelectedShow"><button class = "cheatConfigButton" onclick="${windowKey}.loadConfig()">Load</button><button class = "cheatConfigButton" onclick="${windowKey}.saveConfig()">Save</button><button id = "configDelID" class = "cheatConfigButton cheatHalfButton" onclick="${windowKey}.deleteConfig(this)">Delete</button><button class = "cheatConfigButton cheatHalfButton" onclick="${windowKey}.exportConfig()">Export</button>
            </div> <div id="configSelectedHide"><button class = "cheatConfigButton" onclick="${windowKey}.createConfig()
            ">Create</button><button class = "cheatConfigButton" onclick="${windowKey}.importConfig()
            ">Import</button></div> </div>`
        }
        createSlider(label, configKey, min, max, step = 1) {
            this.mkDefault(configKey, min || "Invalid");
            this.menu.content += `<div class="cheatMainDiv">${label}<span id = "slider-${configKey}" class ="cheatSliderLabel">${globalKey.config[configKey]}</span><br><input class = "cheatSlider" type = "range" min = "${min}" max = "${max}" step = "${step}" value = "${globalKey.config[configKey]}" oninput = "${windowKey}.updateConfig('${configKey}', parseFloat(this.value), '${configKey}')"></div>`
        }
        createInput(label, configKey) {
            this.mkDefault(configKey, "");
            this.menu.content += `<div class="cheatMainDiv">${label}<input class ="cheatInput" type="text" oninput='${windowKey}.updateConfig("${configKey}", this.value)' value="${globalKey.config[configKey]}"></div>`
        }
        createToggle(label, configKey) {
            this.mkDefault(configKey, false);
            this.menu.content += `<div class="cheatMainDiv">${label}<label class="cheatToggle"> <input type="checkbox" onclick='${windowKey}.updateConfig("${configKey}", this.checked)' ${globalKey.config[configKey] ? "checked" : ""}><span></span></label></div>`
        }
        createColorpicker(label, configKey, global) {
            this.mkDefault(configKey, this.menuGlobals.colTheme);
            this.menu.content += `<div class="cheatMainDiv">${label}<input class = "cheatColorpicker" oninput = "${windowKey}.updateConfig('${configKey}', this.value, false, ${global})" type = "color" value = "${global ? globalKey.menuGlobals[configKey] : globalKey.config[configKey]}"></div>`;
        }
        createKeybind(label, configKey) {
            this.mkDefault(configKey, null);
            this.menu.content += `<div class="cheatMainDiv">${label}<div class = "cheatKeybind" onclick = "${windowKey}.updateKeybind('${configKey}', this)">${globalKey.config[configKey] || "None"}</div></div>`
        }
        createSelect(label, options, configKey) {
            this.mkDefault(configKey, null);
            this.menu.content += `<div class="cheatMainDiv">${label}<select class="cheatSelect" onchange="${windowKey}.updateConfig('${configKey}', this.value)">`
            options.forEach(option => {
                this.menu.content += `<option ${option === this.config[configKey] ? "selected" : ""}>${option}</option>`
            })
            this.menu.content += `</select></div>`;
        }
        // Callback system needs to be improved
        createButton(label, callback) {
            this.menu.content += `<div class="cheatMainDiv"><button class="cheatButton" onclick="${callback}" >${label}</button></div>`
        }
        // In the future have this autoresize based on how many children are present in container div (flexbox).
        createSection(label, callback, size) {
            let elSize = {
                "small": "cheatSectionSmall"
            } [size] ?? "";
            this.menu.content += `<fieldset class = "cheatSection ${elSize}"><legend class="cheatLegend">${label}</legend>`;
            callback();
            this.menu.content += "</fieldset>";
        }
        createTabContent(tab, contentCallback) {
            this.menu.content += `<div class = "cheatTabContent ${this.tabs[tab] == this.menuData.currentTab ? "active" : ""}" id="tab-${this.tabs[tab]}">`;
            contentCallback();
            this.menu.content += `</div>`;
        }
        createEvent(text, type, waitTime) {
            console.log("Called with content " + text);
            let eventClass = {
                "error": "cheatEventError",
                "success": "cheatEventSuccess",
                "normal": "cheatEventSuccess"
            } [type || "success"];
            $("#cheatEventHolder").append(`<div class = "${eventClass}" id = "event-${this.menuData.currentEventID}"><p>${text}</p></div>`);
            $(`#event-${this.menuData.currentEventID}`).hide().fadeIn("fast").delay(waitTime || 5000).animate({
                height: 'toggle',
                opacity: 'toggle'
            }, 'fast');
            this.menuData.currentEventID++;
        }
        createKeybinding() {
            document.addEventListener("keyup", event => {
                // added ShiftRight as fallback for laptops
                if (["Insert", "ShiftRight"].includes(event.code) && !this.menuData.currentlyKeybinding)
                    $("#cheatOverlay").fadeToggle();
            });
        }
    }
    return (window[windowKey] = new SedatedGUI(options));
}
