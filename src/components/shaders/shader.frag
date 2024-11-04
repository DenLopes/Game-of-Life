precision mediump float;
varying vec2 vuv;
uniform sampler2D texture;
uniform float cellSize;
uniform vec2 gridSize;

void main() {
    // Find the cell we're in
    vec2 cell = floor(vuv * gridSize);

    // Find where we are in the cell
    vec2 cellUV = fract(vuv * gridSize);

    // Get the cell's state from the texture
    vec2 cellCenter = (cell + 0.5) / gridSize;
    float state = texture2D(texture, cellCenter).r;

    // Optional: Add grid lines
    vec2 gridLines = step(cellSize, cellUV) * step(cellUV, vec2(1.0 - cellSize));
    float isGridLine = max(gridLines.x, gridLines.y);

    // Optional: Add cell borders
    float borderWidth = 0.1; // Adjust for thicker/thinner borders
    vec2 borders = step(1.0 - borderWidth, cellUV) + step(cellUV, vec2(borderWidth));
    float isBorder = min(1.0, borders.x + borders.y);

    // Combine cell state with grid lines and borders
    vec3 cellColor = vec3(state);
    vec3 gridColor = vec3(1.0); // Dark gray grid lines
    vec3 borderColor = vec3(0.4); // Slightly lighter borders

    // Mix colors based on whether we're on a grid line or border
    vec3 finalColor = mix(
        mix(cellColor, gridColor, isGridLine),
        borderColor,
        isBorder * .3);

    gl_FragColor = vec4(finalColor, 1.0);
}