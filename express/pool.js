//Define the canvas
const canvas = document.querySelector('.gameCanvas');

//change the width and height of the canvas element
canvas.width = 1300;
canvas.height = 650;

//Define the canvas as a 2d canvas
const ctx = canvas.getContext('2d');

//Define classes
//Define Pocket Class
class Pocket
{
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
        this.radius = 40;
    }

    display()
    {
        ctx.fillStyle = 'rgb(0,0,0)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2*pi);
        ctx.fill();
        ctx.stroke();
    }
}

//Define Ball Class
class Ball
{
    constructor(x, y, vector)
    {
        this.x = x;
        this.y = y;
        this.radius = 25;
        if(vector)
        {
            this.vector = vector;
        }else
        {
            this.vector = [0,0];
        }
        
        this.vectorLength = Math.sqrt( Math.pow(this.vector[0], 2) + Math.pow(this.vector[1], 2) );
        if(this.vectorLength > 0)
        {
            this.normalVector = [this.vector[0] / this.vectorLength, this.vector[1] / this.vectorLength];
        } else
        {
            this.normalVector = [0,0];
        }
        this.isMoving = (this.vector[0] != 0) || (this.vector[1] != 0);
        this.isSunk = false;
    }

    display()
    {
        //Draw the Circle
        ctx.fillStyle = 'rgb(240,240,230)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2*pi);
        ctx.fill();

        //Draw the Prediction line
        ctx.strokeStyle = 'rgb(255, 0, 0)';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        let lineVector = multVectorLength(shotVector, 20);
        ctx.lineTo(this.x + (lineVector[0] / 2), this.y + (lineVector[1] / 2));
        ctx.stroke();
        ctx.strokeStyle = 'rgb(0,0,0)';
    }

    update()
    {
        //Top and Bottom Barrier Detection
        if((this.y - this.radius <= barrierList[0] && this.vector[1] < 0) || (this.y + this.radius >= barrierList[1] && this.vector[1] > 0))
        {
            this.vector[1] *= -1;
        }

        //Left and Right Barrier Detection
        if((this.x - this.radius <= barrierList[2] && this.vector[0] < 0) || (this.x + this.radius >= barrierList[3] && this.vector[0] > 0))
        {
            this.vector[0] *= -1;
        }

        //Add Vector to Position
        this.x += this.vector[0];
        this.y += this.vector[1];

        //Check if the ball is moving
        this.isMoving = (this.vector[0] != 0) || (this.vector[1] != 0);

        //Length of this Vector
        this.vectorLength = Math.sqrt( Math.pow(this.vector[0], 2) + Math.pow(this.vector[1], 2) );

        //Normalized Vector
        this.normalVector = [this.vector[0] / this.vectorLength, this.vector[1] / this.vectorLength];

        //Decelerate the Vector
        if(!checkOutOfBounds(this))
        {
            this.vectorLength *= 1/deceleration;
        }

        //Cap the speed of the vector
        if(this.vectorLength > shotCap)
        {
            this.vectorLength = shotCap;
        }

        //If the vector is moving less than 0.5, change velocity to 0
        if(Math.abs(this.vectorLength) < 0.5)
        {
            this.vector = [0,0]
        } else
        {
            //The change the vector
            this.vector[0] = this.normalVector[0] * this.vectorLength;
            this.vector[1] = this.normalVector[1] * this.vectorLength;
        }
        
    }
}

//Define Non-Cue Ball Class
class BilliardBall extends Ball
{
    constructor(x, y, number,vector)
    {
        //Inherits the Properties from Ball and adds number
        super(x, y, vector);
        this.number = number;

        //Decide if a ball is striped depending on number
        this.striped = number > 8;

        //Switch Between Colors Depending on number
        this.color;
        switch (number%8)
        {
            case 0:
                this.color = 'rgb(0,0,0)';
                break;

            case 1:
                this.color = 'rgb(200,200,0)';
                break;
            
            case 2:
                this.color = 'rgb(0,0,200)';
                break;
            
            case 3:
                this.color = 'rgb(200,0,0)';
                break;

            case 4:
                this.color = 'rgb(200,0,40)';
                break;
                
            case 5:
                this.color = 'rgb(200,100,0)';
                break;
            
            case 6:
                this.color = 'rgb(0,200,100)';
                break;
    
            case 7:
                this.color = 'rgb(100,0,0)';
                break;
        }
    }

    display()
    {
        //Draw the Base Circle and Base Color
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2*pi);
        ctx.fill();

        //Draw the Stripe if the Ball has a Stripe
        if(this.striped)
        {
            ctx.fillStyle= 'rgb(240,240,240)';
            ctx.fillRect(this.x-(this.radius*(4/5)), this.y - (this.radius*(1/2)), this.radius*1.65, this.radius);
        }

        //Draw the Circle in which the number is displayed
        ctx.fillStyle = 'rgb(240,240,240)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius*0.5, 0, 2*pi);
        ctx.fill();

        //Draw the Number on the Circle
        ctx.fillStyle = 'rgb(0,0,0)';
        ctx.fillText(this.number, this.x-5, this.y+4);
    }
}

//Define any other constants
//Pi (Used to just be 3.15, but Math.pi is more accurate and I don't want to rewrite all my code)
const pi = Math.PI;

//Constant for deceleration
const deceleration = 1.005;

//Constant for Shot Magnatude Cap
const shotCap = 20;

//Table Pockets
const pocketList = 
[
    new Pocket(60, 60),     //Top-left Corner
    new Pocket(60, 590),    //Bottom-left Corner   
    new Pocket(1240, 60),   //Top-right Corner
    new Pocket(1240, 590),  //Bottom-right Corner
    new Pocket(650, 50),    //Top center 
    new Pocket(650, 600)    //Bottom-center
];

//Cue Ball
let cueBall = new Ball(400, 300);

//Start point for the triangle
const triStart = [750, 300];

//List of billiard balls
const billiardList =
[
    new BilliardBall(triStart[0], triStart[1], 1),
    new BilliardBall(triStart[0]+45, triStart[1]-25, 2),
    new BilliardBall(triStart[0]+45, triStart[1]+25, 3),
    new BilliardBall(triStart[0]+90, triStart[1]-50, 4),
    new BilliardBall(triStart[0]+90, triStart[1], 5),
    new BilliardBall(triStart[0]+90, triStart[1]+50, 6),
    new BilliardBall(triStart[0]+135, triStart[1]-75, 7),
    new BilliardBall(triStart[0]+135, triStart[1]-25, 8),
    new BilliardBall(triStart[0]+135, triStart[1]+25, 9),
    new BilliardBall(triStart[0]+135, triStart[1]+75, 10),
    new BilliardBall(triStart[0]+180, triStart[1]-100, 11),
    new BilliardBall(triStart[0]+180, triStart[1]-50, 12),
    new BilliardBall(triStart[0]+180, triStart[1], 13),
    new BilliardBall(triStart[0]+180, triStart[1]+50, 14),
    new BilliardBall(triStart[0]+180, triStart[1]+100, 15)
];

//List of billiards on the board
let billiardsSunk = [];
let collidingBilliards = []; //List of billiards who had been checked for collisions;
for(let i = 0; i < billiardList.length; ++i)
{
    collidingBilliards.push(billiardList[i]);
}

//Set Barriers
const barrierList =
[
    50,    //Top Barrier
    600,   //Bottom Barrier
    50,    //Left Barrier
    1250   //Right Barrier
];

//Variables for the player's shot
let shotVector = [2,0];
let shotAngle = radToDeg(Math.atan2(shotVector[1], shotVector[0]));
let shotMagnatude = getVectorLength(shotVector);

//Loop function
window.main = function () 
{
    window.requestAnimationFrame(main);

    //Function to display the stuff
    displayGame();
    
    //Function to Update the stuff
    ballUpdates();

    console.log(checkBallCollision(cueBall, billiardList[0]));
};
  
main();

//Event Listener For Key Presses. Not directly taken, 
//but example from https://stackoverflow.com/questions/12241113/whats-the-best-way-to-create-key-events-in-html5-canvas
window.addEventListener('keydown', this.checkKeyDown, false)

//Check Key Code
function checkKeyDown (event)
{
    switch (event.keyCode)
    {
        case 40: //Pressing the down key
            shotMagnatude += 0.5; //Increace shot speed

            //Set max for shot magnatude
            if(shotMagnatude > shotCap)
            {
                shotMagnatude = shotCap;
            }
            break;

        case 38: //Pressing the up key
            shotMagnatude -= 0.5; //Decrease shot speed

            //Set min for shot magnatude
            if(shotMagnatude < 2)
            {
                shotMagnatude = 2;
            }
            break;

        case 37: //Pressing the left key
            shotAngle += 5; //Move Shot 5 degrees clockwise

            //Set Max and Min limits for angle
            if(shotAngle >= 360)
            {
                shotAngle -=360;
            } else if(shotAngle < 0)
            {
                shotAngle +=360;
            }
            break;

        case 39: //Pressing the right key
            shotAngle -= 5; //Move Shot 5 degrees counter-clockwise

            //Set Max and Min limits for angle
            if(shotAngle >= 360)
            {
                shotAngle -=360;
            } else if(shotAngle < 0)
            {
                shotAngle +=360;
            }
            break;

        case 32: //Pressing the space bar
            //Assign new Vector to cueBall
            cueBall.vector = shotVector;
            break;
    }
}

//Function for displaying game objects
function displayGame ()
{
    //Draw the Pool Background
    poolBackground();

    //Draw the Pockets
    for(let i = 0; i<pocketList.length; ++i)
    {
        pocketList[i].display();
    }

    //Draw the Cue ball
    cueBall.display();

    //Draw the Other Balls
    for(let i = 0; i<billiardList.length; ++i)
    {
        billiardList[i].display();
    }
}

//Function for updating the balls
function ballUpdates()
{
    //Update Cue Ball
    cueBall.update();
    shotVector = multVectorLength(normalizeVector([Math.sin(degToRad(shotAngle)), Math.cos(degToRad(shotAngle))]), shotMagnatude);
    shotMagnatude = getVectorLength(shotVector);


    //Update the Other Balls
    for(let i = 0; i<billiardList.length; ++i)
    {
        billiardList[i].update();
    }

    //Check for Collisions
    allBallCollisions(billiardList);
}

//Function to draw the pool background
function poolBackground () 
{
    ctx.fillStyle = 'rgb(0,100,0)';
    ctx.fillRect(0, 0, 1300, 650);
    ctx.fillStyle = 'rgb(105,40,0)';
    ctx.fillRect(0, 0, 50, 650);
    ctx.fillRect(0, 0, 1300, 50);
    ctx.fillRect(1250, 0, 50, 650);
    ctx.fillRect(0, 600, 1300, 50);
}

//Function to Calculate Dot Product
function dotProduct (vectorA, vectorB)
{
    return (vectorA[0]*vectorB[0])+(vectorA[1]*vectorB[1]);
}

//Function to Calculate Cross Product
function crossProduct (vectorA, vectorB)
{

}

//Function to Check Collision between 2 Balls
function checkBallCollision (ballA, ballB)
{
    let ballDistance = Math.sqrt(Math.pow(ballA.x-ballB.x, 2) + Math.pow(ballA.y-ballB.y, 2));

    return ballDistance < (ballA.radius + ballB.radius);
}

//Function to Check Overlap between Balls and Pockets
function checkPocketCollision (ball, pocket)
{
    let ballDistance = Math.sqrt(Math.pow(ball.x-pocket.x, 2) + Math.pow(ball.y-pocket.y, 2));

    return ballDistance <= pocket.radius;
}

//Function to Check all collisions of all balls and change velocities accordingly
function allBallCollisions (ballList)
{
    //Copy data from ballList, and move it to colliding Billiards
    /*let collidingBilliards = [];
    for (let i = 0; i<ballList.length; ++i)
    {
        collidingBilliards.push([ballList[i]]);
    }*/

    //Check the Possible Collisions of Billiards with Cue Ball
    for(let i = 0; i<ballList.length; ++i)
    {
        if(checkBallCollision(cueBall, ballList[i]))
        {
            makeNewVectors(cueBall, ballList[i]);
        }
    }

    //Check for collisions between billiards
    for(let j = 0; j<ballList.length-1; ++j)
    {
        for(let i = j+1; i<ballList.length; ++i)
        {
            if(checkBallCollision(ballList[j], collidingBilliards[i]))
            {
                makeNewVectors(ballList[j], ballList[i]);
            }
        }
    }

    //Check for collisions between billiards
    /*for(let i = 0; i<ballList.length; ++i)
    {
        for(let j = 0; j<ballList.length; ++j)
        {
            if(i!=j)
            {
                if(checkBallCollision(ballList[i], ballList[j]))
                {
                    makeNewVectors(ballList[i], ballList[j]);
                }
            }
        }
    }*/
}

//Function to Normalize Vector (Make Vector Length 1)
function normalizeVector (vector)
{
    //Find the length of the input vector
    let vectorLength = getVectorLength(vector);
    
    //Return Normalized Vector (Length of 1)
    return [vector[0] / vectorLength, vector[1] / vectorLength];
}

//Function to Multiply the Length of a Vector
function multVectorLength (vector, multiple)
{
    return [vector[0] * multiple, vector[1] * multiple];
}

//Function to get A Given Vector's length
function getVectorLength (vector)
{
    //Return the length of the input vector
    return Math.sqrt( Math.pow(vector[0], 2) + Math.pow(vector[1], 2) );
}

//Function to add two vectors together
function addVectors (vectorA, vectorB)
{
    //Return total Vector
    return [vectorA[0] + vectorB[0], vectorA[1] + vectorB[1]];
}

//Function to change the vectors of two balls
function makeNewVectors (ballA, ballB)
{
    //Old Math
    /*/Save old vector values in bucket variables
    let oldAVector = [ballA.vector[0], ballA.vector[1]];
    let oldBVector = [ballB.vector[0], ballB.vector[1]];

    let totalMagnatude = getVectorLength(oldAVector)+getVectorLength(oldBVector);
    if(totalMagnatude > shotCap)
    {
        totalMagnatude = shotCap;
    }

    //Create frame of referance around BallB
    let referanceA = [oldAVector[0]-oldBVector[0], oldAVector[1]-oldBVector[1]];

    //Find Contact Vector and Normalize it.
    let contVector = [ballB.x - ballA.x, ballB.y - ballA.y];
    let normalCont = normalizeVector(contVector);

    //Find the angle of referanceA
    let refAAngle = radToDeg(Math.atan2(referanceA[1], referanceA[0]));

    //Find the angle of contactvector
    let contAngle = radToDeg(Math.atan2(contVector[1], contVector[0]));

    //Find the angle of the new A Vector
    let newAAngle = contAngle - 90;

    //Find normalAVector
    let normalAVector = normalizeVector([Math.sin(newAAngle), Math.cos(newAAngle)]);
    let normalBVector = normalCont;

    //Determine the magnatudes of the new vectors
    let ADiverge = refAAngle - newAAngle; //Get the amount that A and B start to diverge from the initial angle
    let BDiverge = refAAngle - contAngle;

    //Make sure that the diverging angles are under 90
    if(ADiverge > 90) 
    {
        ADiverge -= 2*BDiverge
    } else if(BDiverge > 90)
    {
        BDiverge -= 2*ADiverge
    }

    //Assign new magnatudes
    let newAMagnatude = totalMagnatude * (BDiverge / 90); 
    let newBMagnatude = totalMagnatude * (ADiverge / 90);

    //Cap Magnatudes
    if(newAMagnatude > shotCap)
    {
        newAMagnatude = shotCap;
    }
    if(newBMagnatude > shotCap)
    {
        newBMagnatude = shotCap;
    }

    //Assign the new vectors with their new magnatudes
    let newAVector = addVectors(multVectorLength(normalAVector, newAMagnatude), oldBVector);
    let newBVector = addVectors(multVectorLength(normalBVector, newBMagnatude), oldBVector);

    ballA.vector = newAVector;
    ballB.vector = newBVector;*/

    //Save old vector values in bucket variables and get angles for them
    let oldAVector = [ballA.vector[0], ballA.vector[1]];
    let oldBVector = [ballB.vector[0], ballB.vector[1]];

    //Find Contact Vector and get contact angle
    let contVector = [ballB.x - ballA.x, ballB.y - ballA.y];
    let contAngle = Math.atan2(contVector[1], contVector[0]);

    //Get reference for AVector
    let refAVector = [oldAVector[0]-oldBVector[0], oldAVector[1]-oldBVector[1]];

    let gamma = Math.atan2(refAVector[1], refAVector[0]);
    let phi = contAngle - gamma;

    //Make New Vectors
    let newAVector = 
    [
        getVectorLength(refAVector) * Math.sin(phi) * ((Math.sin(phi) * Math.cos(gamma)) + (Math.cos(phi) * Math.sin(gamma))),
        getVectorLength(refAVector) * Math.sin(phi) * ((Math.sin(phi) * Math.sin(gamma)) - (Math.cos(phi) * Math.cos(gamma)))
    ];

    let newBVector = 
    [
        getVectorLength(refAVector) * Math.cos(phi) * ((Math.cos(phi) * Math.cos(gamma)) - (Math.sin(phi) * Math.sin(gamma))),
        getVectorLength(refAVector) * Math.cos(phi) * ((Math.cos(phi) * Math.sin(gamma)) + (Math.sin(phi) * Math.cos(gamma)))
    ];

    //Move the balls outside of each other
    ballB.x = ballA.x + (normalizeVector(contVector)[0] * ballA.radius * 2);
    ballB.y = ballA.y + (normalizeVector(contVector)[1] * ballA.radius * 2);

    //Set the vectors
    ballA.vector = addVectors(newAVector, oldBVector);
    ballB.vector = addVectors(newBVector, oldBVector);
}

//Function to change radians to degrees. 
//Yoinked from https://www.w3resource.com/javascript-exercises/javascript-math-exercise-34.php
function radToDeg(radians)
{
  return radians * (180/pi);
}

//Function to change degrees to radians. 
//Yoinked from https://www.w3resource.com/javascript-exercises/javascript-math-exercise-33.php
function degToRad(degrees)
{
  return degrees * (pi/180);
}

//Function to return boolean to check if a ball is out of bounds
function checkOutOfBounds(ball)
{
    let outsideBounds = false;
    let property = 'y';

    for(let i = 0; i<barrierList.length; ++i)
    {
        //Dynamic Property Access
        if(i>=2)
        {
            property = 'x';
        }else
        {
            property = 'y';
        }

        //Change between <= and >=
        if(i%2 == 0)
        {
            outsideBounds = outsideBounds || (ball[property] - ball.radius <= barrierList[i]);
        }else
        {
            outsideBounds = outsideBounds || (ball[property] - ball.radius >= barrierList[i]);
        }
    }
    return outsideBounds;
}

//Function to check if there are any striped or solid balls left on the board
function checkStripedOrSolid(ballType)
{
    let striped = false;

    for(let i = 0; i<billiardList; ++i)
    {
        striped = striped || billiardList[i].striped;
    }

    if(ballType == 0 || ballType == "solid")
    {
        return !striped;
    }else if(ballType == 1 || ballType == "striped")
    {
        return striped;
    }
}