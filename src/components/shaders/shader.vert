precision mediump float;
attribute vec2 position;
attribute vec2 uv;
varying vec2 vuv;

void main() {
    // This vertex shader is very simple, it just passes the position and uv to the fragment shader
    vuv = uv;
    gl_Position = vec4(position, 0, 1);
}