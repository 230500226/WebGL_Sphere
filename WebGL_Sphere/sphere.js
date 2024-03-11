function showError(errorText) {
    const errorBoxDiv = document.getElementById('error-box'); //find error box
    const errorSpan = document.createElement('p');    //create span (paragraph element) to store error tex
    errorSpan.innerText = errorText; //add error text
    errorBoxDiv.appendChild(errorSpan); //add error text to the box
    console.error(errorText); //console.log(errorText) for redundant error message
}

showError("Hello Test error 1");

function helloTriangle(){ //start code for triangle
    const canvas  = document.getElementById("IDcanvas"); //get ref for the canvas by ID
    if (!canvas){
        showError("Can't find canvas reference"); //error from typo or pre loaded canvas
        return;
    }
    const gl = canvas.getContext('webgl2'); //get ref for webgl2
    if (!gl){
        showError("Can't find webgl2 support"); //error from browser support for webgl2
        return;
    }
    
  const triangleVertices = [0, 0];
  var x, y;
  var deltaP = (2 * Math.PI) / 64;
  var arch = 2 * Math.PI;
  var r = 1;

  for (p = 0; p <= arch; p += deltaP) {
    x = r * Math.cos(p);
    y = r * Math.sin(p);

    jsarray.push(x);
    jsarray.push(y);

  }
    const triangleVerticesCpuBuffer = new Float32Array(triangleVertices); //converting to float34bit for gpu
        //indicates this var is a cpu buffer containing the vertex data needed to send to the gpu

    const triangleGeoBuffer = gl.createBuffer(); //creating a buffer on the gpu to store the vertex data opaque buffer handle
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer); //create an attachment point using bindbuffer as a path to send data to the gpu vertex buffer
    gl.bufferData(gl.ARRAY_BUFFER, triangleVerticesCpuBuffer, gl.STATIC_DRAW); //finally send the data through the bind to the gpu vertex buffer (Static draw for optimal gpu memory ussage for a static render)
                                                                                //Array_buffer specifies data is vertex data Also allocates gpu memory for the buffer

    const vertexShaderSourceCode = `#version 300 es //specifies 3.0 mobile std version
    precision mediump float;
    
    in vec2 vertexPosition; //takes input as attribute (in keyword to specify it is an attribute recieving input from a buffer triangleVertices)
                                //vec2 specifies there are 2 floating point values to be handled
                                    //vertecPosition is the name of the attribute
    void main() {
    
       gl_Position = vec4(vertexPosition, 0.0, 1.0); //gl_Position is the output var that requires 4 dimensions (gl_Position is built in)
                                                        //x,y is already passed through but z,w is hardcoded for a 2D render without transformations

    }`;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER); //create vertex shader
    gl.shaderSource(vertexShader, vertexShaderSourceCode); //send the source code to the shader
    gl.compileShader(vertexShader); //compile the shader

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){ //check for compile error
        const compileError = gl.getShaderInfoLog(vertexShader); //get error info and store it in compileError
            showError('compile vertex error: ' + compileError); //show comile error message in browser
                return;
    }

    const fragmentShaderSourceCode = `#version 300 es
    precision mediump float;

    out vec4 outputColor;

    void main() {
        outputColor = vec4(0.5, 0.0, 0.3, 1.0);
    }`;


    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER); //create vertex shader
    gl.shaderSource(fragmentShader, fragmentShaderSourceCode); //send the source code to the shader
    gl.compileShader(fragmentShader); //compile the shader

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){ //check for compile error
        const compileError = gl.getShaderInfoLog(fragmentShader); //get error info and store it in compileError
            showError('compile fragment error: ' + compileError); //show comile error message in browser
                return;
    }

    const triangleShaderProgram = gl.createProgram(); //create a program and attach both shaders
    gl.attachShader(triangleShaderProgram, vertexShader);
    gl.attachShader(triangleShaderProgram, fragmentShader);

    gl.linkProgram(triangleShaderProgram); //link the program attachments to ensure compatibility
    if (!gl.getProgramParameter(triangleShaderProgram, gl.LINK_STATUS)){ //check for link error
        const linkError = gl.getProgramInfoLog(triangleShaderProgram); //get error info and store it in linkError
            showError('link program error:'+ linkError); //show comile error message in browser
                return;
    }

    const vertexPositionAttributLocation = gl.getAttribLocation(triangleShaderProgram, 'vertexPosition');//get the attribute location from the vertexSourceCode
    if (vertexPositionAttributLocation < 0) {
        showError('failed to get attribute location for vertexPosition');
            return;
    }

    //gpu pipeline START (try to order these steps to reduce state changes (group similar tasks before changing states))
                           //(basic pipeline order for most cases)

    // 1. Output merger - merge the shaded pixel fragment with existing output image
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    gl.clearColor(0,0,0,1); //set color 
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); //use bitwise or operator '|' 
        //clear the color buffer and depth buffer
        //color buffer for color information
        //depth buffer for depth information (location of points)
        //stencil buffer not used (effect rendering)
            //clear cmds needed after width or height cmds

    // 2. Rasterizer - which pixels are part of a triangle
    gl.viewport(0, 0, canvas.width, canvas.height); //specifies which part of the screen to rasterize

    // 3. set GPU program (vertex and fragment shader program pair)
    gl.useProgram(triangleShaderProgram); //plug in the triangleShaderProgram
    gl.enableVertexAttribArray(vertexPositionAttributLocation); //enable the program to get input at that attribute location
    
    //4. Input assembler - how to read vertices from the gpu triangle buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);// make double sure that the buffer is binded
    gl.vertexAttribPointer(
        // index - which attribute to use
        vertexPositionAttributLocation,
        // size - how many components in the attribute
        2,
        // type - set the data type stored in the GPU buffer for the attribute
        gl.FLOAT,
        // normalized - conversion from ints into floats (not needed for attributes set as floats already)
        false,
        // stride - the amount of bytes used for one vertex to determine the start of the next vertex
        0, // 0 is defualt, allows predefined webgl calculations to calculate the amount of bytes needed to stride based on the amount of components and the data type sent
        // 2 * Float32Array.BYTES_PER_ELEMENT - example of manually calculating the bytes needed to stride
        // offset - Amount off bytes to skip reading within the attribute 
        0
    );

    // 5. Draw call (primitive assembly must be final)
    gl.drawArrays(gl.TRIANGLES, 0,3); //gl.TRIANGLE - method of organising tri together, 0 - first vertex index, 3 - number of vertices processed 
    //gpu pipeline END
}

try {
    helloTriangle(); //try to execute the helloTriangle function
} catch (e) {
    showError(`Uncaught JavaScript exception: ${e}`); //catch unhandled exception errors if it fails
}
