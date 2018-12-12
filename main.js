function main() {
  const math = require('gl-matrix')
  
  const vsSource = `
  uniform float uTime;
  uniform vec3 uCentralPos;

  attribute float aLifeTime; //kolko zivi ova cestica
  attribute vec2 aTextureCoords;
  attribute vec2 aTriCorner;

  attribute vec3 aCenterOffset;

  attribute vec3 aVelocity;

  uniform mat4 uProjMatrix;
  uniform mat4 uViewMatrix;
  
  varying float vLifetime;
  varying vec2 vTextureCoords;
  
  void main() {
    float time = mod(uTime, aLifeTime);

    vec4 position = vec4(
      uCentralPos + aCenterOffset + (time * aVelocity),
      1.0
    );
  
    vLifetime = 1.3 - (time / aLifeTime); //dal stvarno trebam ovako nesto??
    vLifetime = clamp(vLifetime, 0.0, 1.0);
    float size = (vLifetime * vLifetime) * 0.05;
  
    vec3 cameraRight = vec3(
      uViewMatrix[0].x, uViewMatrix[1].x, uViewMatrix[2].x
    );
    vec3 cameraUp = vec3(
      uViewMatrix[0].y, uViewMatrix[1].y, uViewMatrix[2].y
    );
    position.xyz += (cameraRight * aTriCorner.x * size) +
     (cameraUp * aTriCorner.y * size);
    
    gl_Position = uProjMatrix * uViewMatrix * position;
  
    vTextureCoords = aTextureCoords;
    vLifetime = aLifeTime;
  }
  `

  const fsSource = `
  precision mediump float;

  uniform float uFragTime;
  uniform vec4 uColor;
  
  void main() {
  }
  `


  const canvas = document.createElement('canvas')
  canvas.width = 500
  canvas.height = 500
  
  const image = document.createElement('img')
  image.style.display = 'none'
  image.src = './snow.bmp'
  let imageIsLoaded = false

  const body = document.body
  body.appendChild(canvas)
  body.appendChild(image)

  const gl = canvas.getContext('webgl')
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  // gl.enable(gl.DEPTH_TEST)
  // gl.enable(gl.CULL_FACE)
  // gl.frontFace(gl.CCW)
  // gl.cullFace(gl.BACK)

  const vertexShader = gl.createShader(gl.VERTEX_SHADER)
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)

  gl.shaderSource(vertexShader, vsSource)
  gl.shaderSource(fragmentShader, fsSource)

  gl.compileShader(vertexShader)
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error('Vertex shader didn t compile: ', gl.getShaderInfoLog(vertexShader))
    return
  }
  gl.compileShader(fragmentShader)
  if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error('Fragment shader didn t compile: ', gl.getShaderInfoLog(fragmentShader))
    return
  }
  
  const program = gl.createProgram()

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program didn t link: ', gl.getProgramInfoLog(program))
    return
  }
  
  gl.useProgram(program)





  let timeUniformLocation = gl.getUniformLocation(program, 'uTime')
  let fragTimeUniformLocation = gl.getUniformLocation(program, 'uFragTime')
  let centralPosUniformLocation = gl.getUniformLocation(program, 'uCentralPos')
  let colorUniformLocation = gl.getUniformLocation(program, 'uColor')

  let centralPosition = [0.0, 0.0, 0.0]
  let mainColor = [0.2, 0.1, 0.1, 1.0]
  let clockTime = 3
  let previousTime = new Date().getTime()
  
  let draw = function() {
    if (imageIsLoaded) {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      let currentTime = new Date().getTime()
      clockTime = clockTime + (previousTime - currentTime) / 1000
      previousTime = currentTime

      gl.uniform1f(timeUniformLocation, clockTime)
      gl.uniform1f(fragTimeUniformLocation, clockTime)
      gl.uniform3fv(centralPosUniformLocation, centralPosition)
      gl.uniform4fv(colorUniformLocation, mainColor)
    }
    window.requestAnimationFrame(draw)
  }

  window.requestAnimationFrame(draw)

}  

main()