//display errors in the browser
function showError(errorText) {
    const errorBoxDiv = document.getElementById('error-box'); //find error box
    const errorSpan = document.createElement('p');    //create span (paragraph element) to store error tex
    errorSpan.innerText = errorText; //add error text
    errorBoxDiv.appendChild(errorSpan); //add error text to the box
    console.error(errorText); //console.log(errorText) for redundant error message
}

function mainFunction(){

    // Get canvas
    const canvas = document.getElementById("IDcanvas");
    if (!canvas){
        showError("Can't find canvas reference");
        return;
    }

    // Get context for webgl
    const gl = canvas.getContext("webgl2");
    if (!gl){
        showError("Can't find webgl2 support");
        return;
    }

    //  Shader source code
    const vSSC = `#version 300 es
    precision mediump float;
    in vec3 vertexPosition;
    uniform vec4 mRot;
    in vec4 colorValue;
    out vec4 varyColor;
    void main() {
        gl_Position = vec4(vertexPosition, 1.0) * mRot;
        gl_PointSize = 5.0; 
        varyColor = colorValue;
    }
    `;

    // Create vertex shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vSSC);
    gl.compileShader(vertexShader);

    // Error checking vertex shader
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        const errorMessage = gl.getShaderInfoLog(vertexShader);
        showError('Compile vertex error: ' + errorMessage);
        return;
    }

    // Fragment shader source code for pentagon (neon green)
    const fSSCCube = `#version 300 es
    precision mediump float;
    in vec4 varyColor;
    out vec4 outColor;
    void main() {
        outColor = vec4(varyColor); 
    }`;

    // Create fragment shader
    const fragmentShaderCube = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShaderCube, fSSCCube);
    gl.compileShader(fragmentShaderCube);

    if (!gl.getShaderParameter(fragmentShaderCube, gl.COMPILE_STATUS)){
        const errorMessage = gl.getShaderInfoLog(fragmentShaderCube);
        showError('Compile fragment error: ' + errorMessage);
        return;
    }
    // Create shader program for cube
    const programCube = gl.createProgram();
    gl.attachShader(programCube, vertexShader);
    gl.attachShader(programCube, fragmentShaderCube);
    gl.linkProgram(programCube);

    if (!gl.getProgramParameter(programCube, gl.LINK_STATUS)) {
        const errorMessage = gl.getProgramInfoLog(programCube);
        showError(`Failed to link GPU program: ${errorMessage}`);
        return;
    }

    // Get attribLocation of vertexPosition initial positionVertex
    const positionVertex = gl.getAttribLocation(programCube, "vertexPosition");
    if (positionVertex < 0) {
        showError(`Failed to get attribute location for vertexPosition`);
        return;
    }

    const positionColor = gl.getAttribLocation(programCube, "colorValue");
    if (positionColor < 0) {
        showError(`Failed to get attribute location for colorValue`);
        showError(positionColor);
        return;
    }

    // Define the vertices for the cube

    const arrayCube = [
        // Vertices        // RGBA
        // Red (front face)
        -0.5, -0.5, 0,     1.0, 0.0, 0.0, 1.0,  
        -0.5, 0.5, 0,      0.1, 0.1, 0.1, 0.0,
        0.5, 0.5, 0,       0.1, 0.1, 0.1, 0.0,
        0.5, -0.5, 0,      0.1, 0.1, 0.1, 0.0,

        // Top face (Green)
        -0.5, 0.5, 0,      0.0, 1.0, 0.0, 1.0,
        -0.5, 0.5, 1,      0.0, 1.0, 0.0, 1.0,
        0.5, 0.5, 1,       0.0, 1.0, 0.0, 1.0,
        0.5, 0.5, 0,       0.0, 1.0, 0.0, 1.0,

        // Right face (Blue)
        0.5, -0.5, 0,      0.0, 0.0, 1.0, 1.0,
        0.5, 0.5, 0,       0.0, 0.0, 1.0, 1.0,
        0.5, 0.5, 1,       0.0, 0.0, 1.0, 1.0,
        0.5, -0.5, 1,      0.0, 0.0, 1.0, 1.0,

        // Back face (Yellow)
        0.5, -0.5, 1,      1.0, 1.0, 0.0, 1.0,
        0.5, 0.5, 1,       1.0, 1.0, 0.0, 1.0,
        -0.5, 0.5, 1,      1.0, 1.0, 0.0, 1.0,
        -0.5, -0.5, 1,     1.0, 1.0, 0.0, 1.0,
        
        // Bottom face (Purple)
        -0.5, -0.5, 1,     0.5, 0.0, 0.5, 1.0,
        -0.5, -0.5, 0,     0.5, 0.0, 0.5, 1.0,
        0.5, -0.5, 0,      0.5, 0.0, 0.5, 1.0,
        0.5, -0.5, 1,      0.5, 0.0, 0.5, 1.0,

        // Left face (Orange)
        -0.5, -0.5, 1,     1.0, 0.5, 0.0, 1.0,
        -0.5, 0.5, 1,      1.0, 0.5, 0.0, 1.0,
        -0.5, 0.5, 0,      1.0, 0.5, 0.0, 1.0,
        -0.5, -0.5, 0,     1.0, 0.5, 0.0, 1.0 
    ];
    // Create the buffer for the cube
    const bufferTriangle = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferTriangle);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrayCube), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionVertex);
    gl.enableVertexAttribArray(positionColor);
    gl.enable(gl.DEPTH_TEST);

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    gl.vertexAttribPointer(positionVertex, 3, gl.FLOAT, false, 7*4, 0);
    gl.vertexAttribPointer(positionColor, 4, gl.FLOAT, false, 7*4, 3*4);

    gl.useProgram(programCube);

    function draw() {

        gl.clearColor(0.1, 0.3, 0.3, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Draw the cube

        mat4.rotateZ(matrix, matrix, Math.PI/2 / 70);
        mat4.rotateX(matrix, matrix, Math.PI/2 / 70);
        gl.uniformMatrix4fv(uniformLocations.matrix, false, matrix);
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferTriangle);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        gl.drawArrays(gl.TRIANGLE_FAN, 4, 4);
        gl.drawArrays(gl.TRIANGLE_FAN, 8, 4);
        gl.drawArrays(gl.TRIANGLE_FAN, 12, 4);
        gl.drawArrays(gl.TRIANGLE_FAN, 16, 4);
        gl.drawArrays(gl.TRIANGLE_FAN, 20, 4);
    }

    const uniformLocations = {
        matrix: gl.getUniformLocation(programCube, `matrix`),
    };

    const matrix = mat4.create();
    mat4.translate(matrix, matrix, [.2, .5, 0]);
    mat4.scale(matrix, matrix, [0.25, 0.25, 0.25]);

    function update() {
    }

    var isAnimating = false;
    function toggleAnimation() {
        isAnimating = !isAnimating;
        if (isAnimating) {
            loop();
        }
    }
    function loop() {
        if (!isAnimating) {
            return;
        }
        update();
        draw();
        requestAnimationFrame(loop);
    }

    toggleAnimation();
}

try {
    mainFunction();
} catch (error) {
    showError('failed to run mainFunction() JS exception'+error);
}

