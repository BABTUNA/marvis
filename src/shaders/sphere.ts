export const sphereVertexShader = /* glsl */ `
  attribute float aRelevance;
  attribute vec3 aColor;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vRelevance;
  varying vec3 vColor;
  varying float vDepth;

  uniform float uTime;

  void main() {
    vColor = aColor;
    vRelevance = aRelevance;

    // Gentle breathing when idle (low relevance)
    float breath = 1.0 + 0.08 * sin(uTime * 0.8 + float(gl_InstanceID) * 1.37) * (1.0 - aRelevance);
    vec3 pos = position * breath;

    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
    vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);
    vViewDir = normalize(-mvPosition.xyz);
    vDepth = -mvPosition.z;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const sphereFragmentShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vRelevance;
  varying vec3 vColor;
  varying float vDepth;

  uniform float uTime;

  void main() {
    // Fresnel rim — sharper for relevant spheres
    float fresnelPow = mix(3.0, 2.0, vRelevance);
    float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), fresnelPow);

    // Core glow
    float core = pow(max(dot(vNormal, vViewDir), 0.0), 2.0);

    // Idle breathing brightness
    float breathBright = 0.02 * sin(uTime * 1.2 + vColor.x * 10.0) * (1.0 - vRelevance);

    // Base dim emission with breath
    float baseIntensity = 0.06 + 0.05 * core + breathBright;

    // Relevance boost with warm shift
    float relevanceGlow = vRelevance * (1.2 + 0.8 * fresnel);

    vec3 color = vColor * (baseIntensity + relevanceGlow);

    // White-gold rim for high relevance
    vec3 rimColor = vec3(1.0, 0.92, 0.78);
    color += rimColor * fresnel * vRelevance * 0.6;

    // Subtle warm tint on rim even at idle
    color += rimColor * fresnel * 0.02 * (1.0 - vRelevance);

    // Atmospheric edge
    float alpha = 0.2 + 0.5 * (core + fresnel * 0.3) + vRelevance * 0.5;
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

    // Pulsing size based on relevance + idle twinkle
    float twinkle = 0.15 * sin(uTime * 1.5 + position.x * 7.0 + position.z * 3.0) * (1.0 - aRelevance);
    float pulse = 1.0 + 0.3 * sin(uTime * 2.0 + position.x * 5.0) * aRelevance;
    float size = aSize * (0.5 + twinkle + aRelevance * 2.5) * pulse;

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

    float softEdge = 1.0 - smoothstep(0.15, 0.5, dist);

    // Glow intensity
    float intensity = 0.05 + vRelevance * 1.2;
    vec3 color = vColor * intensity * softEdge;

    // Bloom-friendly bright core for relevant points
    float coreBright = smoothstep(0.25, 0.0, dist) * vRelevance * 1.5;
    color += vec3(1.0, 0.92, 0.78) * coreBright;

    float alpha = softEdge * (0.06 + vRelevance * 0.88);

    gl_FragColor = vec4(color, alpha);
  }
`;
