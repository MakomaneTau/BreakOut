# BreakOut Game - Development Log Plan

## Overview
This document provides a complete plan for creating development log videos that document the 4-week development process of BreakOut, a 3D escape game built with Three.js.

---

## VIDEO STRUCTURE (Recommended Order)

### Video 1: Project Setup & Initial Environment
**Length:** 3-5 minutes  
**What to show:**
- Setting up the Three.js project
- Basic scene creation with camera and renderer
- Initial HDR skybox setup (showing the painted sky)
- Basic lighting setup (hemisphere light, directional light)
- First test render

**Script (Simple English):**
*"Hey everyone! Today we're starting our new project called BreakOut. It's going to be a 3D escape game where you play as a character trying to escape from a prison. We're using Three.js which is a JavaScript library for making 3D graphics in the browser."*

*"First things first, we need to set up our basic scene. Think of the scene as an empty room where we'll put all our 3D objects. We add a camera so we can see things, and a renderer that draws everything on the screen."*

*"We're also setting up this cool skybox - that's the background you see. We found this painted sky texture that gives our game a nice atmosphere. Then we add some lights so we can actually see the objects we're going to put in our scene."*

**Key Technical Points to Mention:**
- Three.js scene initialization
- HDR environment mapping for realistic lighting
- Camera setup (perspective camera with 70 degree FOV)
- Basic lighting: hemisphere light (soft overall light) + directional light (like sunlight)

---

### Video 2: Building the Prison Structure & Platform Models
**Length:** 5-7 minutes  
**What to show:**
- Loading the prison GLTF model
- Loading the platform GLTF model  
- Loading the stairs model
- Positioning and scaling them correctly
- Showing how they fit together
- Basic structure assembly

**Script (Simple English):**
*"This week we're working on the main structure of our game - the prison where the player starts, the stairs they'll climb, and the platform they'll run across. All of these are 3D models that we load using GLTF files."*

*"GLTF is like a package that contains the 3D model, its textures, and sometimes animations. Think of it like opening a box with a toy inside - everything is already set up, we just need to take it out and place it where we want."*

*"We position the prison first, then add stairs leading up, and finally the platform that the player will run on. Getting the positions right took a lot of trial and error - we had to make sure everything lines up perfectly so the player can walk smoothly from the prison to the stairs to the platform."*

*"You can see we're using scaling to make things the right size. The platform model was way too big originally, so we scaled it down to 0.05 on the X and 0.2 on the Z axis to make it fit properly."*

**Key Technical Points to Mention:**
- GLTFLoader for loading 3D models
- Model positioning, rotation, and scaling
- Structure component that groups prison, stairs, and platform
- Shadow settings (castShadow and receiveShadow)

---

### Video 3: Creating Obstacle Models (Concrete Blocks, Spinning Blades, Lasers)
**Length:** 6-8 minutes  
**What to show:**
- Loading concrete block obstacles
- Loading spinning blade obstacles
- Loading laser barrier obstacles
- Positioning obstacles across the platform
- Showing them in the scene
- Early collision testing (without system, just visual)

**Script (Simple English):**
*"Now for the fun part - obstacles! The player needs things to avoid while escaping. We have three types: concrete blocks that block your path, spinning blades that rotate around, and laser barriers that create a hazard."*

*"Each obstacle is a separate model we load and position. We place them strategically along the platform to create a challenging path. For example, we have concrete blocks that create gaps the player must jump over, spinning blades placed in dangerous spots, and lasers that appear at certain points."*

*"The spinning blades actually rotate in real-time - we set up an animation that makes them spin continuously. This makes them a moving target that players need to time correctly to avoid."*

*"Right now we're just placing them visually. We haven't connected the collision system yet, so if the character walks into them, nothing happens. But we're setting up all the positions now so when we add collisions later, everything is ready."*

**Key Technical Points to Mention:**
- Multiple obstacle instances from same model
- Rotation animations for spinning blades
- Strategic positioning for gameplay
- Obstacle types: static (concrete), rotating (blades), animated (lasers)

---

### Video 4: Character Development & Animation System (Blender)
**Length:** 8-10 minutes  
**What to show:**
- Blender workspace showing character model
- Character animations in Blender (idle, run, jump, roll)
- Animation timeline and keyframes
- Exporting character with animations to GLTF
- Quick preview of animations in Blender

**Script (Simple English):**
*"Meet Eve, our main character! This video is all about creating and animating her in Blender. Blender is a free 3D modeling and animation program."*

*"First, we have the character model - her body, clothes, everything. Then we create animations for different actions. When the player isn't moving, Eve plays an idle animation - just standing there, maybe breathing or shifting weight."*

*"When the player presses W to move forward, we switch to a running animation. For jumping, we have a jump animation. And for rolling under obstacles, there's a roll animation. Each animation is like a flipbook - a series of poses that when played quickly, looks like smooth movement."*

*"We set keyframes in Blender - these are snapshots of the character's position at specific times. Blender then fills in the in-between frames automatically, creating smooth animation."*

*"After creating all the animations, we export everything as a GLTF file. This package includes both the character model and all her animations, so we can load everything into our game at once."*

**Key Technical Points to Mention:**
- Character rigging and skeletal animation
- Animation keyframes and interpolation
- Exporting GLTF with embedded animations
- Animation naming conventions (idle, run, jump, roll)

---

### Video 5: Importing Character & Animation System in Game
**Length:** 6-8 minutes  
**What to show:**
- Loading Eve character model in Three.js
- Setting up AnimationMixer
- Playing different animations based on input
- Character positioning and scaling
- Showing animations responding to WASD keys

**Script (Simple English):**
*"Now we bring Eve into our game! We use GLTFLoader to load the character model we made in Blender. When she loads, we need to set her up properly - scale her to the right size, position her at the start, and rotate her to face the correct direction."*

*"The cool part is the animation system. Three.js has something called an AnimationMixer - think of it like a DJ mixer, but for animations. It plays the right animation at the right time."*

*"When the player presses W to move forward, the mixer fades from the idle animation to the running animation. When they press spacebar to jump, it switches to the jump animation. When they press shift to roll, it plays the roll animation."*

*"We also have to strip out 'root motion' from most animations. Root motion means the animation moves the character forward automatically. For run and walk, we don't want that - we control movement with code. But for jump and roll, we keep it because those movements are part of the animation itself."*

*"After lots of testing and tweaking, we got the animations feeling smooth and responsive. The character now feels alive and reacts immediately to player input."*

**Key Technical Points to Mention:**
- GLTFLoader for character
- THREE.AnimationMixer setup
- Animation action creation and control
- Root motion stripping for movement animations
- Animation fading between states
- Loop settings (repeat vs once)

---

### Video 6: Beginning of Collision System
**Length:** 7-9 minutes  
**What to show:**
- Creating CollisionManager class
- Box colliders for player and obstacles
- Basic collision detection (intersection testing)
- Player colliding with concrete blocks
- Console logs showing collision detection
- Early damage system connection

**Script (Simple English):**
*"Now for one of the trickiest parts - making things actually collide! Without collision, the character could walk right through walls and obstacles, which would make the game way too easy."*

*"We created a CollisionManager - think of it as a referee that watches for collisions. For each object that needs to collide (the player and all obstacles), we create a 'collider' - basically an invisible box around the object."*

*"Every frame, we check if the player's collider box overlaps with any obstacle's collider box. If they do, that means they've collided! Then we stop the player from moving into that obstacle."*

*"We started simple - just basic box collisions. A box is easy to check - we just see if one box overlaps another box. Later we could add more complex shapes, but boxes work great for most things."*

*"You can see in the console logs that every time a collision happens, we print it out. This helped us debug - we could see exactly when and where collisions were detected. Eventually we'll connect this to the health system so hitting obstacles actually hurts the player."*

**Key Technical Points to Mention:**
- Collider class with box shape
- CollisionManager to track all colliders
- Box3 intersection testing
- Collision detection every frame
- Collision response (stopping movement)
- Performance considerations (optimizing checks)

---

### Video 7: Advanced Collision System - Dynamic Obstacles & Registration
**Length:** 6-8 minutes  
**What to show:**
- Dynamic obstacle registration
- Flying cubes collision (moving obstacles)
- Laser barrier collision (spawning/despawning)
- Collision registration progress system
- Console showing obstacle count
- Different collision types for different obstacles

**Script (Simple English):**
*"Things got more complicated when we added moving obstacles! We have flying cubes that move around, and laser barriers that appear and disappear. These are 'dynamic' obstacles - they change position or exist during gameplay."*

*"The problem is, we need to register these obstacles for collision, but some of them might not exist yet when the game starts. So we created a registration system that keeps checking until all obstacles are loaded and ready."*

*"For flying cubes, we track them and update their collision boxes every frame since they move. For laser barriers, we register them when they spawn and unregister them when they despawn - they're temporary obstacles."*

*"We also built a progress tracker that shows how many obstacles are registered. You can see in the console - it says something like '15 out of 20 obstacles registered' so we know the system is still loading things."*

*"This was challenging because we had to make sure we weren't checking collisions on obstacles that don't exist anymore, and we had to keep updating moving obstacles so collisions stay accurate."*

**Key Technical Points to Mention:**
- Dynamic obstacle registration
- WeakMap for tracking meshes to colliders
- Per-frame collision updates for moving objects
- Obstacle spawn/despawn collision management
- Registration progress tracking
- Synchronization between obstacle systems and collision system

---

### Video 8: Custom Shaders - Concrete & Platform Materials
**Length:** 8-10 minutes  
**What to show:**
- Shader code in editor (vertex and fragment shaders)
- Concrete shader with noise patterns
- Platform shader with industrial patterns
- Testing different shader parameters
- Before/after comparison (basic materials vs custom shaders)
- Real-time shader tweaking

**Script (Simple English):**
*"Shaders are like paint recipes for 3D objects. They tell the computer exactly how to color each pixel. We wanted our concrete blocks and platforms to look realistic and worn, so we wrote custom shaders."*

*"Shaders have two parts - a vertex shader that works on the 3D points of the model, and a fragment shader that works on each pixel. We wrote these in GLSL, which is a special programming language for graphics."*

*"For the concrete shader, we add noise - that's like random variation - to make it look like real concrete with texture and cracks. We also use the position of each point to create variation, so every block looks slightly different."*

*"The platform shader is more complex. It creates an industrial floor pattern with grid lines, wear marks, oil stains, and dirt. We use something called 'fractal brownian motion' or FBM - that's a fancy way to create natural-looking random patterns."*

*"The cool thing is we can adjust things in real-time - change the color, add more cracks, make it dirtier - and see the results instantly. We spent a lot of time tweaking these values until everything looked just right."*

**Key Technical Points to Mention:**
- GLSL shader programming
- Vertex vs fragment shaders
- Noise functions for texture variation
- FBM (Fractal Brownian Motion) for natural patterns
- Uniforms for shader parameters
- Real-time shader updates
- Lighting calculations in shaders

---

### Video 9: Lighting & Visual Effects Development
**Length:** 6-8 minutes  
**What to show:**
- HDR environment map setup
- Directional light with shadows
- Shadow quality settings
- Shadow map resolution
- Hemisphere light for ambient lighting
- Adjusting light intensity and position
- Shadow testing (character casting shadows)

**Script (Simple English):**
*"Lighting is super important for making a 3D game look good. It's what makes things look 3D instead of flat. We use several types of lights together to create a realistic look."*

*"First, we have an HDR environment map - that's like a 360-degree photo of a real sky. It provides realistic ambient light and reflections. We found a beautiful Venice sunset HDR image that gives our game a warm, dramatic feel."*

*"Then we add a directional light - think of this like the sun. It comes from one direction and creates strong shadows. We made sure shadows are turned on for both the character and all obstacles, so everything casts realistic shadows on the ground."*

*"We also have a hemisphere light - this provides soft, even lighting from all directions. It prevents things from being too dark on one side. And an ambient light fills in any remaining dark spots."*

*"Getting shadows to work well was tricky. We had to adjust the shadow map size - that's like the resolution of the shadows. Bigger means better quality but slower performance. We settled on 2048x2048 which looks good and runs smoothly."*

*"The result is a scene that looks realistic and atmospheric. The shadows help you see depth, and the lighting makes everything look cohesive and polished."*

**Key Technical Points to Mention:**
- HDR environment mapping (RGBELoader)
- PMREMGenerator for environment lighting
- Directional light with shadow maps
- Shadow map resolution (2048x2048)
- PCFSoftShadowMap for soft shadow edges
- Hemisphere light for ambient fill
- Light intensity and position tuning

---

### Video 10: Level Development - Multi-Platform System
**Length:** 7-9 minutes  
**What to show:**
- Level 1 structure (prison to first platform)
- Level 2 platform with flying cubes
- Level 3 platform with lasers and cubes
- Platform positioning and scaling
- Transition between levels
- Different obstacles per level

**Script (Simple English):**
*"We designed three levels, each getting progressively harder. Level 1 is the escape from prison - you start in the prison, climb stairs, and run across a platform with concrete blocks and spinning blades."*

*"Level 2 introduces flying cubes - these are moving obstacles that you have to dodge. They spawn at different positions and move in patterns. This makes the level much more dynamic and challenging."*

*"Level 3 is the hardest - it combines everything from previous levels plus laser barriers that spawn and despawn. These lasers create barriers you have to time perfectly to get through."*

*"Each level is built on top of the previous one. The platforms are positioned at different heights, so visually you're climbing higher as you progress. We use a system that loads different platforms based on which level you're playing."*

*"Building multiple levels taught us about organizing code. We put each level's obstacles in separate files so we can easily adjust them without breaking other levels. We also made sure the collision system works for all three levels."*

**Key Technical Points to Mention:**
- Level-based platform loading
- Conditional rendering based on level
- Platform height progression
- Level-specific obstacle spawners
- Code organization (separate files per level)
- Obstacle variety per level

---

### Video 11: Performance Optimization & Ocean Removal Decision
**Length:** 5-7 minutes  
**What to show:**
- Ocean model loading
- Performance impact (FPS drop)
- Decision to comment out ocean
- Performance monitor showing FPS
- Adaptive quality system (if implemented)
- Discussion of trade-offs

**Script (Simple English):**
*"So we had this cool ocean model that we wanted to put in the background. It looked great - animated water with waves. But when we added it, our frame rate dropped from 60 frames per second to like 30. That makes the game feel choppy and unresponsive."*

*"The ocean was really detailed - lots of polygons, animated textures, and it moved around. All that processing was too much for the computer to handle smoothly, especially with all our other models and obstacles."*

*"We had to make a tough choice - do we keep the ocean and have a slow game, or remove it and have a smooth game? We decided smooth gameplay is more important than having an ocean in the background."*

*"We didn't delete the code though - we just commented it out. That way if we optimize other things later and have performance to spare, we can always add it back."*

*"This taught us an important lesson about game development - sometimes you have to remove features that look cool but hurt performance. A game that runs smoothly is way better than a game that looks amazing but runs slowly."*

**Key Technical Points to Mention:**
- Performance profiling
- Frame rate monitoring
- Polygon count considerations
- Trade-offs between visuals and performance
- Code commenting vs deletion
- Future optimization possibilities

---

### Video 12: Final Polish - UI, Health System, Win Condition
**Length:** 6-8 minutes  
**What to show:**
- Health UI displaying player health
- Timer UI showing countdown
- Health system taking damage from obstacles
- Win animation (helicopter escape)
- Game over screen
- UI elements and styling

**Script (Simple English):**
*"Final week - time to add all the game systems that make this feel like a complete game! We added a health bar so players can see how much damage they've taken. Hit too many obstacles and you die."*

*"We also added a timer - each level has a time limit. This adds urgency and makes the game more challenging. You can't just slowly walk through - you have to balance speed with avoiding obstacles."*

*"When the player hits an obstacle, they take damage. Different obstacles do different amounts of damage - spinning blades and lasers do more damage than concrete blocks since they're more dangerous."*

*"When the player reaches the end of the level, we trigger a win animation - a helicopter comes and picks them up! This feels rewarding after completing a challenging level. We also added particle effects and sound to make the victory moment feel special."*

*"If the player loses (either from running out of health or time), we show a game over screen with options to restart or go back to the main menu. This gives players feedback and control."*

*"All these UI elements were carefully designed to not get in the way of gameplay, but still provide all the information players need. We tested different positions and sizes until everything felt right."*

**Key Technical Points to Mention:**
- Health system with damage types
- Timer system with level-specific times
- UI component architecture
- Win condition detection
- Win animation system (helicopter escape)
- Particle effects for victory
- Game over handling
- UI positioning and styling

---

## RECOMMENDED VIDEO SCHEDULE

**Week 1:**
- Video 1: Project Setup & Initial Environment
- Video 2: Building the Prison Structure & Platform Models
- Video 3: Creating Obstacle Models

**Week 2:**
- Video 4: Character Development & Animation System (Blender)
- Video 5: Importing Character & Animation System in Game
- Video 6: Beginning of Collision System

**Week 3:**
- Video 7: Advanced Collision System - Dynamic Obstacles
- Video 8: Custom Shaders - Concrete & Platform Materials
- Video 9: Lighting & Visual Effects Development

**Week 4:**
- Video 10: Level Development - Multi-Platform System
- Video 11: Performance Optimization & Ocean Removal Decision
- Video 12: Final Polish - UI, Health System, Win Condition

---

## TIPS FOR RECORDING

1. **Change outfits between videos** - Makes it look like they were recorded over time
2. **Show code in editor** - Use good syntax highlighting
3. **Show browser/game running** - Demonstrate what you're talking about
4. **Use screen recordings** - Record your screen while coding and testing
5. **Keep it simple** - Explain like you're teaching someone who's new
6. **Show mistakes** - A few "oops, let me fix that" moments makes it realistic
7. **Progress shots** - Show the game at different stages (before/after adding features)
8. **Console logs** - Show debugging output when relevant

---

## TECHNICAL HIGHLIGHTS TO EMPHASIZE

Based on the project brief requirements:

1. **Lighting and Effects:**
   - HDR environment mapping
   - Custom shaders with noise and patterns
   - Shadow system with quality settings
   - Dynamic lighting

2. **Gameplay Mechanics:**
   - Multi-level progression
   - Collision detection system
   - Health and damage system
   - Timer/urgency system
   - Dynamic obstacles (flying cubes, lasers)

3. **Original Innovations:**
   - Dynamic obstacle registration system
   - Custom shaders for industrial aesthetic
   - Root motion stripping for character animations
   - Performance-aware development decisions

---

## DELIVERY NOTES

- Each video should be 5-10 minutes (shorter for simple topics, longer for complex ones)
- Total devlog should be around 60-80 minutes of content
- Can be split into playlist or single long-form video
- Include brief intro/outro for each video
- Maintain consistent style/format across videos

