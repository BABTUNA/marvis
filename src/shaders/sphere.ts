export const sphereVertexShader = /* glsl */ `
  attribute float aRelevance;
  attribute vec3 aColor;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vRelevance;
  varying vec3 vColor;

  void main() {
    vColor = aColor;
    vRelevance = aRelevance;

    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);
    vViewDir = normalize(-mvPosition.xyz);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const sphereFragmentShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vRelevance;
  varying vec3 vColor;

  void main() {
    // Fresnel rim
    float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 3.0);

    // Core glow
    float core = pow(max(dot(vNormal, vViewDir), 0.0), 2.0);

    // Base dim emission
    float baseIntensity = 0.15 + 0.1 * core;

    // Relevance boost
    float relevanceGlow = vRelevance * (1.5 + 1.0 * fresnel);

    vec3 color = vColor * (baseIntensity + relevanceGlow);

    // Add white-hot rim for high relevance
    color += vec3(1.0, 0.95, 0.85) * fresnel * vRelevance * 0.8;

    // Atmospheric edge
    float alpha = 0.3 + 0.7 * (core + fresnel * 0.5) + vRelevance * 0.5;
    alpha = clamp(alpha, 0.0, 1.0);

    gl_FragColor = vec4(color, alpha);
  }
`;

export const momentsVertexShader = /* glsl */ `
  attribute float aRelevance;
  attribute vec3 aColor;
  attribute float aSize;

  varying float vRelevance;
  varying vec3 vColor;

  uniform float uTime;

  void main() {
    vRelevance = aRelevance;
    vColor = aColor;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    // Pulsing size based on relevance
    float pulse = 1.0 + 0.3 * sin(uTime * 2.0 + position.x * 5.0) * aRelevance;
    float size = aSize * (0.5 + aRelevance * 2.0) * pulse;

    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const momentsFragmentShader = /* glsl */ `
  varying float vRelevance;
  varying vec3 vColor;

  void main() {
    // Soft circle
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;

    float softEdge = 1.0 - smoothstep(0.2, 0.5, dist);

    // Glow intensity
    float intensity = 0.1 + vRelevance * 1.5;
    vec3 color = vColor * intensity * softEdge;

    // Add bloom-friendly bright core for relevant points
    float coreBright = smoothstep(0.3, 0.0, dist) * vRelevance * 2.0;
    color += vec3(1.0, 0.95, 0.85) * coreBright;

    float alpha = softEdge * (0.15 + vRelevance * 0.85);

    gl_FragColor = vec4(color, alpha);
  }
`;
