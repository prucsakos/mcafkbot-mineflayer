const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const { GoalNear } = goals

const VERSION = "12"
const DEBUGMODE = true
//const ANTIAFKATSTART = true
//const ANTIAFK_FORWARDTIME = 1000
//const ANTIAFK_JUMPTIME = 500
let nowFishing = false; // Track fishing mode state
let antiAfkEnabled = false
let antiAfkInterval = 10000
const options = {
    host: 'Ryy1.aternos.me', // Change this to the ip you want.
    port: 48173, // Change this to the port you want.
    username: "Agoston"
  }

const welcomeMessages = [
    "Szia, {username}! Hogy érzed magad ma?",
    "Üdv a szerveren, {username}! Remélem, jól fogod érezni magad!",
    "Hey {username}, üdvözöllek! Mit tervezel ma játszani?",
    "{username} csatlakozott a játékhoz. Készen áll kalandra?",
    "Nagy örömünkre szolgál, hogy velünk vagy, {username}! Van kedved beszélgetni?",
    "Szia {username}! Remélem, szuper napod van. Kérdezz bátran, ha segítségre van szükséged!",
    "Helló, {username}! Üdvözöllek a csapatban. Milyen játékmódot szeretsz a legjobban?",
    "{username} érkezett. Kíváncsi vagyok a történetedre!",
    "Üdv, {username}! Készen állsz egy új kihívásra?",
    "Hé {username}, reméljük, hoztál magaddal jó kedvet!",
    "{username}, szívélyes üdvözlet! Ha kérdésed van, csak szólj!",
    "Szia {username}! Már vártunk! Készen állsz a játékra?",
    "Üdv a szerveren, {username}! Reméljük, nagyszerű időt töltesz itt.",
    "Szervusz {username}! Ha szükséged van társaságra a játékhoz, csak jelezz!",
    "Hey {username}, szuper, hogy csatlakoztál! Hogyan vagy ma?"
];
  
let bot = null

bot = createBot(options)
setupBot(bot)

/// HELPER

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/// END OF HELPER

// EATING FNC

async function eatFoodIfNeeded() {
    if (bot.food < 18) { // Adjust this threshold as needed
        // Define a list of known food item names
        const knownFoodItems = [
            'apple', 'baked_potato', 'beef', 'bread', 'carrot',
            'cooked_chicken', 'cooked_cod', 'cooked_mutton', 'cooked_porkchop',
            'cooked_rabbit', 'cooked_salmon', 'cookie', 'melon_slice', 'mushroom_stew',
            'pumpkin_pie', 'rabbit_stew', 'beetroot', 'beetroot_soup', 'sweet_berries'
            // Add or remove items based on your Minecraft version and needs
        ];

        // Find the first item in the inventory that matches the known food items
        const foodItem = bot.inventory.items().find(item => knownFoodItems.includes(item.name));

        if (foodItem) {
            console.log('Eating', foodItem.name);
            try {
                // Equip the food item in the bot's hand
                await bot.equip(foodItem, 'hand');
                console.log('Eating', foodItem.name);
                // Now consume the food item
                await bot.consume();
                console.log('Finished eating');
            } catch (err) {
                console.error('Could not eat:', err.message);
            }
        } else {
            bot.chat("I'm hungry but have no food.");
        }
    } else {
        console.log('No need to eat. Hunger level is good.');
    }
}

//// FISHING FUNCTIONS - from https://github.com/PrismarineJS/mineflayer/blob/master/examples/fisherman.js
function toggleFishingMode() {
    if (nowFishing) {
        //console.log("Stop fishing - from toggle")
        stopFishing()
        nowFishing = !nowFishing
    } else {
        //console.log("Start fishing - from toggle")
        nowFishing = !nowFishing
        startFishing()
    }
}

function onCollect(player, entity) {
    if (entity.kind === 'Drops' && player === bot.entity) {
        console.log("oncolleclt: isfishing." + nowFishing)
        console.log("onCollect triggered");
        if (nowFishing) {
            // Only restart fishing if we're still in fishing mode
            startFishing();
        }
    }
}
  
async function startFishing() {

    while(nowFishing) {
        console.log("Fishing...  - from startFishing");
        try {
            await bot.equip(bot.registry.itemsByName.fishing_rod.id, 'hand');
            await bot.fish()
            console.log("Finished a fish")
        } catch (err) {
            console.log(err.message)
            bot.chat("Vmi félre ment halászás közben");
        }
    }
    bot.chat("Halászat vége")

    //if (nowFishing) return; // Prevents starting fishing if already fishing
    //console.log("Fishing...  - from startFishing");
    //nowFishing = true;
//
    //try {
    //    await bot.equip(bot.registry.itemsByName.fishing_rod.id, 'hand');
    //    bot.on('playerCollect', onCollect); // Ensure the listener is set each time we start fishing
    //    await bot.fish();
    //    console.log("Finished a fish")
    //} catch (err) {
    //    console.log(err.message);
    //    bot.chat("Vmi félre ment halászás közben");
    //}
    //nowFishing = false; // Move this into onCollect for re-triggering startFishing
}
  
function stopFishing() {
    if (nowFishing) {
        console.log("Stop fishing - from stopFishing");
        bot.activateItem(); // Potentially stop the fishing action
        // nowFishing = false;
        // bot.removeListener('playerCollect', onCollect); // Properly manage listener
    }
}
/// END OF FISHING FUNCTIONS

function findClosestBed() {
    const beds = bot.findBlocks({
        matching: block => bot.isABed(block),
        maxDistance: 16,
        count: 1
    });

    if (beds.length) {
        return bot.blockAt(beds[0]);
    } else {
        return null;
    }
}

//function antiAfkFnc() {
//    antiAfkEnabled = !antiAfkEnabled;
//    bot.chat(antiAfkEnabled ? "Anti AFK bekapcsolva." : "Anti AFK kikapcsolva.");
//
//    if (antiAfkEnabled) {
//        antiAfkInterval = setInterval(() => {
//            // Rotate 360 degrees
//            let currentYaw = bot.entity.yaw;
//            let newYaw = currentYaw + Math.PI; // Rotate 180 degrees
//            bot.look(newYaw, 0, false); // pitch is set to 0, false for smooth movement
//
//            // Move a little bit
//            // Toggle forward movement briefly
//            bot.setControlState('forward', true);
//            setTimeout(() => bot.setControlState('forward', false), ANTIAFK_FORWARDTIME); // Move forward for 1 second
//            
//            // Jump
//            bot.setControlState('jump', true);
//            setTimeout(() => bot.setControlState('jump', false), ANTIAFK_JUMPTIME);
//            
//
//        }, 10000); // Every 10 seconds
//    } else {
//        clearInterval(antiAfkInterval);
//    }
//}

function createBot(options) {
    return mineflayer.createBot(options)
}

// pass by reference
function setupBot(bot) { 
    // Load pathfinder plugin
    bot.loadPlugin(pathfinder)
    
    /// FUNCTIONS
    
    // Function to find the closest bed
    // Returns bed object or null
    
    //////// SPAWN
    bot.once('spawn', () => {

//        if (ANTIAFKATSTART){
//            if (!antiAfkEnabled) {
//                antiAfkFnc()
//            }
//        }

        bot.chat('Hali, jöttem afkolni')

        if (DEBUGMODE) {
            console.log("Debug mode on")
            bot.chatAddPattern(
                /^(.*)$/,
                "_debug",
                "Debug"
            )
            bot.on("_debug", (text)=>{console.log(text)})
        }

        bot.on('end', (text) => {
            console.log("The bot disconnected.")
            console.log(text)
            console.log("Creating new bot....")
            bot = createBot(options)
            bot = setupBot(bot)
        })
        bot.on('kicked', (text) => {
            console.log("The bot is kicked")
            console.log(text)
            console.log("Creating new bot....")
            bot = createBot(options)
            bot = setupBot(bot)
        })

        //// CHAT EVENTS
        bot.chatAddPattern(
            /^<(\S+)> (!help|!segíts)$/,
            'user_request_help',
            "User requested for available chat commands"
        )
        const request_help_handler = (name, command) => {
            bot.chat(["Elérhető parancsaim:", "!help / !segíts - segítek", "!come / !gyere - megyek hozzád", "!antiafk - mozgok néha vagy valami",
                        "!where !hol !holvagy - elmondom hol vagyok",
                        "!feküdj!sleep!aludj",
                        "!teddle - keresek egy chestet és berakom a chestbe",
                    "!fish!fishing!hal - adj egy botot és halászok"].join("\n"))
        }
        bot.on('user_request_help', request_help_handler)

        // CALL THE BOT
        bot.chatAddPattern(
            /^<(\S+)> (!come|!gyere)$/,
            'user_request_come',
            "User requested the bot to come"
        )

        bot.on('user_request_come', (username, command) => {
            const player = bot.players[username] ? bot.players[username].entity : null

            if (!player) {
                bot.chat("Nem találak, hol vagy?")
                return
            }

            const mcData = require('minecraft-data')(bot.version)
            const defaultMove = new Movements(bot, mcData)
            bot.pathfinder.setMovements(defaultMove)

            bot.chat("Jövök ide: " + player.position.x.toFixed(2).toString() + " " + player.position.y.toFixed(2).toString() +" "+ player.position.z.toFixed(2).toString()) 
            const goal = new GoalNear(player.position.x, player.position.y, player.position.z, 1)
            bot.pathfinder.goto(goal)
                .then(() => bot.chat("Itt vagyok!"))
                .catch(err => {
                    console.log(err)
                    bot.chat("Nem tudok odamenni.")
                })
        })

        // CHAT EVENTS for antiafk
//        bot.chatAddPattern(
//            /^<(\S+)> (!antiafk)$/,
//            'user_toggle_antiafk',
//            "User toggled Anti AFK feature"
//        )
//
//        bot.on('user_toggle_antiafk', (username, command) => {
//            console.log("Toggle antiafk...")
//            antiAfkFnc()
//        })

        // CHAT EVENTS for asking the bot's location
        bot.chatAddPattern(
            /^<(\S+)> (!where|!hol|!holvagy)$/,
            'user_request_location',
            "User requested the bot's location"
        )

        bot.on('user_request_location', (username, command) => {
            // Access the bot's current position
            const pos = bot.entity.position
            // Format the position to a readable string
            const posText = `Jelenlegi pozícióm: X=${pos.x.toFixed(2)}, Y=${pos.y.toFixed(2)}, Z=${pos.z.toFixed(2)}`
            // Send the position in chat
            bot.chat(posText)
        })

        // CHAT EVENTS for asking the bot's location
        bot.chatAddPattern(
            /^<(\S+)> (!eat|!egyél)$/,
            'user_request_eat',
            "Eat"
        )

        bot.on('user_request_eat', async (username, command) => {
            console.log("I start eating..")
            await eatFoodIfNeeded()
        })

        // CHAT EVENTS for sleeping
        bot.chatAddPattern(
            /^<(\S+)> (!sleep|!lay|!feküdj)$/,
            'user_request_sleep',
            "User requested the bot to sleep"
        );

        bot.on('user_request_sleep', async (username, command) => {
            try {
                const bed = findClosestBed();
                console.log("Ágy keresése befejeződött, " + bed? "Van ágy" : "Nincs ágy")
                if (bed) {
                    await bot.sleep(bed);
                    bot.chat("Jó éjt!");
                } else {
                    bot.chat("Nem találtam ágyat.");
                }
            } catch (err) {
                console.error(err);
                bot.chat("Nem tudok aludni most.");
            }
        })

        // CHAT EVENTS for sleeping
        bot.chatAddPattern(
            /^<(\S+)> (!version)$/,
            'user_request_version',
            "Version"
        );

        bot.on('user_request_version', (username, command) => {
            bot.chat("Version: " + VERSION)
        })

        // Inside setupBot function, after other bot.chatAddPattern calls
        bot.chatAddPattern(
            /^<(\S+)> (!fishing|!fish|!hal)$/,
            'user_toggle_fishing',
            "User toggled fishing mode"
        );

        bot.on('user_toggle_fishing', async (username) => {
            toggleFishingMode();
        });

        bot.chatAddPattern(
            /^<(\S+)> !teddle$/,
            'user_request_teddle',
            "User requests the bot to teddle"
        );
        
        bot.on('user_request_teddle', async (username) => {
            const mcData = require('minecraft-data')(bot.version);
            const chestId = mcData.blocksByName.chest.id; // For regular chests

            const chestBlocks = bot.findBlocks({
                matching: chestId,
                maxDistance: 16,
                count: 1
            });
        
            if (chestBlocks.length === 0) {
                bot.chat("Nincs láda a közelben");
                return;
            }
        
            try {
                const chestPosition = bot.blockAt(chestBlocks[0]);
                const chest = await bot.openContainer(chestPosition);
        
                for (let item of bot.inventory.items()) {
                    await chest.deposit(item.type, null, item.count);
                }
        
                bot.chat("Bedobtam őket a ládába");
                await chest.close();
            } catch (error) {
                console.error(error);
                bot.chat("Nem sikerült betenni őket.");
            }
        });

        // Listen for when a player joins the game
        bot.on('playerJoined', (player) => {
            // Check if the joined player is not the bot itself
            if (player.username !== bot.username) {
                // Select a random welcome message
                const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)].replace('{username}', player.username);
                bot.chat(randomMessage);
            }
        })
    })
}


  
  
  
  
// 
// const http = require('http');
// const http_on = true
// 
// /////////// CREATE HTTP CONNECTION
// // Create a simple HTTP server
// 
// if (http_on){
//     const server = http.createServer((req, res) => {
//     // Simple routing
//     if (req.url === '/') {
//         res.writeHead(200, {'Content-Type': 'text/html'});
//         res.write('<h1>Welcome to the Bot Control Panel</h1>');
//         res.end();
//     } else if (req.url === '/status') {
//         const status = {
//             online: bot && bot.isOnline(), // Check if the bot is online
//             // Add more status indicators as needed
//         };
//         res.writeHead(200, {'Content-Type': 'application/json'});
//         res.end(JSON.stringify(status));
//     } else {
//         // Not found
//         res.writeHead(404);
//         res.end('Not Found');
//     }
//     });
//     
//     // Listen on port 3000 for HTTP requests
//     server.listen(3000, () => {
//         console.log('HTTP server running on http://localhost:3000');
//     });
// 
// }    
// 