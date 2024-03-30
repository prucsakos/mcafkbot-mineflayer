const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const { GoalNear } = goals

const VERSION = "10"
const DEBUGMODE = true
const ANTIAFKATSTART = true
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
  
const bot = mineflayer.createBot(options)
// Load pathfinder plugin
bot.loadPlugin(pathfinder)

/// FUNCTIONS

// Function to find the closest bed
// Returns bed object or null
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

function antiAfkFnc() {
    antiAfkEnabled = !antiAfkEnabled;
    bot.chat(antiAfkEnabled ? "Anti AFK bekapcsolva." : "Anti AFK kikapcsolva.");

    if (antiAfkEnabled) {
        antiAfkInterval = setInterval(() => {
            // Rotate 360 degrees
            let currentYaw = bot.entity.yaw;
            let newYaw = currentYaw + Math.PI; // Rotate 180 degrees
            bot.look(newYaw, 0, false); // pitch is set to 0, false for smooth movement

            // Move a little bit
            // Toggle forward movement briefly
            bot.setControlState('forward', true);
            setTimeout(() => bot.setControlState('forward', false), 300); // Move forward for 1 second
            
            // Jump
            bot.setControlState('jump', true);
            setTimeout(() => bot.setControlState('jump', false), 100);
            

        }, 10000); // Every 10 seconds
    } else {
        clearInterval(antiAfkInterval);
    }
}

//////// SPAWN
bot.once('spawn', () => {

    if (ANTIAFKATSTART){
        antiAfkFnc()
    }

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

    //// CHAT EVENTS
    bot.chatAddPattern(
        /^<(\S+)> (!help|!segíts)$/,
        'user_request_help',
        "User requested for available chat commands"
    )
    const request_help_handler = (name, command) => {
        bot.chat(["Elérhető parancsaim:", "!help / !segíts - segítek", "!come / !gyere - megyek hozzád", "!antiafk - mozgok néha vagy valami",
                    "!where !hol !holvagy - elmondom hol vagyok",
                    "!feküdj!sleep!aludj"].join("\n"))
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
    bot.chatAddPattern(
        /^<(\S+)> (!antiafk)$/,
        'user_toggle_antiafk',
        "User toggled Anti AFK feature"
    )

    bot.on('user_toggle_antiafk', (username, command) => {
        antiAfkFnc()
    })

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


  
  
  
  

const http = require('http');
const http_on = true

/////////// CREATE HTTP CONNECTION
// Create a simple HTTP server

if (http_on){
    const server = http.createServer((req, res) => {
    // Simple routing
    if (req.url === '/') {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write('<h1>Welcome to the Bot Control Panel</h1>');
        res.end();
    } else if (req.url === '/status') {
        const status = {
            online: bot && bot.isOnline(), // Check if the bot is online
            // Add more status indicators as needed
        };
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(status));
    } else {
        // Not found
        res.writeHead(404);
        res.end('Not Found');
    }
    });
    
    // Listen on port 3000 for HTTP requests
    server.listen(3000, () => {
        console.log('HTTP server running on http://localhost:3000');
    });

}    
