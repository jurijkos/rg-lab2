const math = require('gl-matrix').mat4

let canvas = document.createElement('canvas')
canvas.width = 600
canvas.height = 600

const mainWindow = document.body

mainWindow.appendChild(canvas)

let isDragging = false
let xRotation = 0
let yRotation = 0
let lastMouseX = 0
let lastMouseY = 0

canvas.onmousedown = function (e) {
  isDragging = true
  lastMouseX = e.pageX
  lastMouseY = e.pageY
}
canvas.onmousemove = function (e) {
  if (isDragging) {
    xRotation += (e.pageY - lastMouseY) / 60
    yRotation -= (e.pageX - lastMouseX) / 60
    lastMouseX = e.pageX
    lastMouseY = e.pageY
  }
}
canvas.onmouseup = function (e) {
  isDragging = false
}
let xSpeed = Array(800).fill(0.0)
let newXSpeed = 0.0
window.onkeypress = function (e) {
  if (e.key === 'a') {
    newXSpeed -= 0.05
  }
  else if (e.key === 'd') {
    newXSpeed += 0.05
  }
}

window.setInterval(() => {
  xSpeed.unshift(newXSpeed)
  xSpeed.pop()
}, 10)

let gl = canvas.getContext('webgl')
gl.clearColor(0.3, 0.65, 0.97, 1.0)
gl.enable(gl.BLEND)
gl.blendFunc(gl.ONE, gl.ONE)

let vertexGLSL = `
uniform float uTime;
uniform mat4 uPMatrix;
uniform mat4 uViewMatrix;
uniform float xSpeed[800];

attribute float aLifetime;
attribute vec2 aTextureCoords;
attribute vec2 aTriCorner;
attribute vec3 aCenterOffset;
attribute float aVelocity;

varying vec2 vTextureCoords;

void main (void) {
  float time = mod(uTime, aLifetime);
  float extraTime = time * 100.0;
  
  int ab = int(floor(extraTime));
  
  vec4 position = vec4(aCenterOffset + (time * vec3(0, aVelocity, 0)), 1.0);
  for(int i = 0; i < 800; i++) {
    if (i < ab) {
      position.x = position.x + xSpeed[ab - i] / 800.0;
    }
  }
  vec3 cameraRight = vec3(uViewMatrix[0].x, uViewMatrix[1].x, uViewMatrix[2].x);
  vec3 cameraUp = vec3(uViewMatrix[0].y, uViewMatrix[1].y, uViewMatrix[2].y);
  position.xyz += (cameraRight * aTriCorner.x * 0.015) + (cameraUp * aTriCorner.y * 0.015);
  
  gl_Position = uPMatrix * uViewMatrix * position;
  vTextureCoords = aTextureCoords;
}
`

let fragmentGLSL = `
precision mediump float;

uniform sampler2D uSnowflake;

varying vec2 vTextureCoords;

void main (void) {
  gl_FragColor = texture2D(uSnowflake, vTextureCoords);
}
`

const vertexShader = gl.createShader(gl.VERTEX_SHADER)
gl.shaderSource(vertexShader, vertexGLSL)
gl.compileShader(vertexShader)

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
gl.shaderSource(fragmentShader, fragmentGLSL)
gl.compileShader(fragmentShader)

const shaderProgram = gl.createProgram()
gl.attachShader(shaderProgram, vertexShader)
gl.attachShader(shaderProgram, fragmentShader)
gl.linkProgram(shaderProgram)
gl.useProgram(shaderProgram)

let lifetimeAttrib = gl.getAttribLocation(shaderProgram, 'aLifetime')
let texCoordAttrib = gl.getAttribLocation(shaderProgram, 'aTextureCoords')
let triCornerAttrib = gl.getAttribLocation(shaderProgram, 'aTriCorner')
let centerOffsetAttrib = gl.getAttribLocation(shaderProgram, 'aCenterOffset')
let velocityAttrib = gl.getAttribLocation(shaderProgram, 'aVelocity')
gl.enableVertexAttribArray(lifetimeAttrib)
gl.enableVertexAttribArray(texCoordAttrib)
gl.enableVertexAttribArray(triCornerAttrib)
gl.enableVertexAttribArray(centerOffsetAttrib)
gl.enableVertexAttribArray(velocityAttrib)

let timeUni = gl.getUniformLocation(shaderProgram, 'uTime')
let perspectiveUni = gl.getUniformLocation(shaderProgram, 'uPMatrix')
let viewUni = gl.getUniformLocation(shaderProgram, 'uViewMatrix')
let xSpeedUniformLocation = gl.getUniformLocation(shaderProgram, 'xSpeed')

let imageIsLoaded = false
let snowTexture = gl.createTexture()
let snowflake = new window.Image()
snowflake.onload = function () {
  gl.bindTexture(gl.TEXTURE_2D, snowTexture)
  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, snowflake
  )
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  imageIsLoaded = true
}
snowflake.src = 'snow.bmp'

let numParticles = 300
let lifetimes = []
let triCorners = []
let texCoords = []
let vertexIndices = []
let centerOffsets = []
let velocities = []

let triCornersCycle = [
  -1.0, -1.0,
  1.0, -1.0,
  1.0, 1.0,
  -1.0, 1.0
]
let texCoordsCycle = [
  0, 0,
  1, 0,
  1, 1,
  0, 1
]


for (let i = 0; i < numParticles; i++) {
  let lifetime = 5 + 3 * Math.random()
  
  let diameter = 0.5
  let xStartOffset = diameter * Math.random() - diameter / 2
  let yStartOffset = 0.5
  let zStartOffset = diameter * Math.random() - diameter / 2
  zStartOffset /= 2
 
  let upVelocity = -0.05 - 0.10 * Math.random()
  
  for (let j = 0; j < 4; j++) {
    lifetimes.push(lifetime)

    triCorners.push(triCornersCycle[j * 2])
    triCorners.push(triCornersCycle[j * 2 + 1])

    texCoords.push(texCoordsCycle[j * 2])
    texCoords.push(texCoordsCycle[j * 2 + 1])
    
    centerOffsets.push(xStartOffset)
    centerOffsets.push(yStartOffset )
    centerOffsets.push(zStartOffset)

    velocities.push(upVelocity)
    
  }

  vertexIndices = vertexIndices.concat([
    0, 1, 2, 0, 2, 3
  ].map(function (num) { return num + 4 * i }))
}

function createBuffer (bufferType, DataType, data) {
  let buffer = gl.createBuffer()
  gl.bindBuffer(gl[bufferType], buffer)
  gl.bufferData(gl[bufferType], new DataType(data), gl.STATIC_DRAW)
  return buffer
}
createBuffer('ARRAY_BUFFER', Float32Array, lifetimes)
gl.vertexAttribPointer(lifetimeAttrib, 1, gl.FLOAT, false, 0, 0)

createBuffer('ARRAY_BUFFER', Float32Array, texCoords)
gl.vertexAttribPointer(texCoordAttrib, 2, gl.FLOAT, false, 0, 0)

createBuffer('ARRAY_BUFFER', Float32Array, triCorners)
gl.vertexAttribPointer(triCornerAttrib, 2, gl.FLOAT, false, 0, 0)

createBuffer('ARRAY_BUFFER', Float32Array, centerOffsets)
gl.vertexAttribPointer(centerOffsetAttrib, 3, gl.FLOAT, false, 0, 0)

createBuffer('ARRAY_BUFFER', Float32Array, velocities)
gl.vertexAttribPointer(velocityAttrib, 1, gl.FLOAT, false, 0, 0)

createBuffer('ELEMENT_ARRAY_BUFFER', Uint16Array, vertexIndices)

gl.activeTexture(gl.TEXTURE0)
gl.bindTexture(gl.TEXTURE_2D, snowTexture)

gl.uniformMatrix4fv(
  perspectiveUni, 
  false, 
  math.perspective([], Math.PI / 3, 1, 0.01, 1000)
)
function createCamera () {
  let camera = math.create()

  math.translate(camera, camera, [0, 0, 0.5])

  let xAxisRotation = math.create()
  let yAxisRotation = math.create()
  math.rotateX(xAxisRotation, xAxisRotation, -xRotation)
  math.rotateY(yAxisRotation, yAxisRotation, yRotation)
  math.multiply(camera, xAxisRotation, camera)
  math.multiply(camera, yAxisRotation, camera)

  let cameraPos = [camera[12], camera[13], camera[14]]
  math.lookAt(camera, cameraPos, [0, 0, 0], [0, 1, 0])
  return camera
}

let previousTime = new Date().getTime()
let clockTime = 3

function draw () {
  if (imageIsLoaded) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    let currentTime = new Date().getTime()
    clockTime += (currentTime - previousTime) / 1000
    previousTime = currentTime

    gl.uniform1f(timeUni, clockTime)
    gl.uniform1fv(xSpeedUniformLocation, xSpeed)
    gl.uniformMatrix4fv(viewUni, false, createCamera())
    gl.drawElements(gl.TRIANGLES, numParticles * 6, gl.UNSIGNED_SHORT, 0)
  }
  window.requestAnimationFrame(draw)
}
window.requestAnimationFrame(draw)

