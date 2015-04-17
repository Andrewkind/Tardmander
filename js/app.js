
// A cross-browser requestAnimationFrame
// See https://hacks.mozilla.org/2011/08/animating-with-javascript-from-setinterval-to-requestanimationframe/
var requestAnimFrame = (function(){
    return window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(callback){
            window.setTimeout(callback, 1000 / 60);
        };
})();

// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 1012;
canvas.height = 480;
document.body.appendChild(canvas);

// The main game loop
var lastTime;
function main() {
    var now = Date.now();
    var dt = (now - lastTime) / 1000.0;

    update(dt);
    render();

    lastTime = now;
    requestAnimFrame(main);
};

function init() {
    terrainPattern = ctx.createPattern(resources.get('img/terrain.png'), 'repeat');

    document.getElementById('play-again').addEventListener('click', function() {
        reset();
    });

    reset();
    lastTime = Date.now();
    main();
}

resources.load([
    'img/playSprite.png',
    'img/terrain.png',
    'img/down.png',
    'img/cube.png'
]);
resources.onReady(init);

// Game state
var player = {
    pos: [0, 0],
    sprite: new Sprite('img/playSprite.png', [0, 0], [70, 64], 16, [19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0])
};

var enemies = [];
var cubes = [];

for (i = 1; i < 23; i++) { 
    cubes.push( {
    pos: [canvas.width - 50 * i, canvas.height - 50],
    sprite: new Sprite('img/cube.png', [0, 0], [50, 50], 16, [0, 1, 2, 3, 2, 1])
});


}

var gameTime = 0;
var isGameOver;
var terrainPattern;

var score = 0;
var scoreEl = document.getElementById('score');

var gravity = 3;
var velocity = 0;
var maxVelocity = 29;
var canJump = false;
var isJumping = false;
var prevY = player.pos[1];

//cube floor 
var cubeSpeed = 100;

// Speed in pixels per second
var playerSpeed = 700;

//spawn initial enemy
        enemies.push({
            speed: Math.floor((Math.random() * 200)) + 200 + (score * 2),
            pos: [canvas.width,
                  Math.random() * (canvas.height - 100)],
            sprite: new Sprite('img/down.png', [0, 0], [80, 74],
                               6, [0, 1, 2, 3, 2, 1])
        });

// Update game objects
function update(dt) {
    gameTime += dt;

    handleInput(dt);
    updateEntities(dt);


    

    // It gets harder over time by adding enemies using this
    // equation: 1-.993^gameTime

    var gameT = gameTime / 2;
    if(Math.random() < 1 - Math.pow(.998, gameT) && enemies.length < 4) {
        enemies.push({
            speed: Math.floor((Math.random() * 200)) + 200 + (score * 2),
            pos: [canvas.width,
                  Math.random() * (canvas.height - 100)],
            sprite: new Sprite('img/down.png', [0, 0], [80, 74],
                               6, [0, 1, 2, 3, 2, 1])
        });
    }

    checkCollisions();

    scoreEl.innerHTML = "Score: " + score;
};

function handleInput(dt) {

   
    if(input.isDown('LEFT') || input.isDown('a')) {
        player.pos[0] -= playerSpeed * dt;
    }

    if(input.isDown('RIGHT') || input.isDown('d')) {
        player.pos[0] += playerSpeed * dt;
    }

    if(input.isDown('SPACE') &&
       !isGameOver && canJump && isJumping) {
        velocity += 5;
        if (velocity >= maxVelocity) {
            canJump = false;
        }
    }

}

function updateEntities(dt) {

    //416 - 50
    if (player.pos[1] != 366 && !isJumping) {
        
        gravity += 0.2;
    }

    if (player.pos[1] == 366) {
        
        canJump = true;
        gravity = 3;
        if (velocity < 0) {
            velocity = 0;
        }
    }
    if (prevY >= player.pos[1]) {
        isJumping = true;
    }
    else {
        isJumping = false;
    }
    prevY = player.pos[1];


    //update velocity
    player.pos[1] -= (velocity);
    velocity -= gravity;

    if (velocity <= -30) {
        
        velocity = -30;

    }



    // Update the player sprite animation
    player.sprite.update(dt);

   // cube.sprite.update(dt);

    //update cubes
     for(var i=0; i<cubes.length; i++) {
        cubes[i].pos[0] -= cubeSpeed * dt;
        

        // Remove cube if it goes offscreen
        if(cubes[i].pos[0] <= -50 ) {
            //cubes.splice(i, 1);
            //i--;
            cubes[i].pos[0] = canvas.width;
        }
        cubes[i].sprite.update(dt);
     }


    // Update all the enemies
    for(var i=0; i<enemies.length; i++) {
        enemies[i].pos[0] -= enemies[i].speed * dt;
        enemies[i].sprite.update(dt);

        // Remove if offscreen
        if(enemies[i].pos[0] + enemies[i].sprite.size[0] < 0) {
            enemies.splice(i, 1);
            i--;
            if (!isGameOver) {
            score++;
            }

        }
    }


}

// Collisions

function collides(x, y, r, b, x2, y2, r2, b2) {
    return !(r <= x2 || x > r2 ||
             b <= y2 || y > b2);
}

function boxCollides(pos, size, pos2, size2) {

    var margin = 20;

    return collides(pos[0], pos[1],
                    pos[0] + size[0]-margin, pos[1] + size[1]-margin,
                    pos2[0], pos2[1],
                    pos2[0] + size2[0]-margin, pos2[1] + size2[1]-margin);
}

function checkCollisions() {
    checkPlayerBounds();
    
    // Run collision detection for all enemies and bullets
    for(var i=0; i<enemies.length; i++) {
        var pos = enemies[i].pos;
        var size = enemies[i].sprite.size;



        if(boxCollides(pos, size, player.pos, player.sprite.size)) {
            gameOver();
        }
    }
}

function checkPlayerBounds() {
    // Check bounds
    if(player.pos[0] < 0) {
        player.pos[0] = 0;
    }
    else if(player.pos[0] > canvas.width - player.sprite.size[0]) {
        player.pos[0] = canvas.width - player.sprite.size[0];
    }

    if(player.pos[1] < 0) {
        player.pos[1] = 0;
    }
    else if(player.pos[1] > canvas.height - player.sprite.size[1] - 50) {
        player.pos[1] = canvas.height - player.sprite.size[1] - 50;
    }
}

// Draw everything
function render() {
    ctx.fillStyle = terrainPattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render the player if the game isn't over
    if(!isGameOver) {
        renderEntity(player);
    }

    renderEntities(enemies);
    renderEntities(cubes);
};

function renderEntities(list) {
    for(var i=0; i<list.length; i++) {
        renderEntity(list[i]);
    }    
}

function renderEntity(entity) {
    ctx.save();
    ctx.translate(entity.pos[0], entity.pos[1]);
    entity.sprite.render(ctx);
    ctx.restore();
}

// Game over
function gameOver() {
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('game-over-overlay').style.display = 'block';
    isGameOver = true;
}

// Reset game to original state
function reset() {
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('game-over-overlay').style.display = 'none';
    isGameOver = false;
    gameTime = 10;
    score = 0;

    enemies = [];

    player.pos = [50, canvas.height / 2];
    //cube.pos = [50, canvas.height / 2];
};
