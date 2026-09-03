import * as THREE from "three";

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform float time;
varying vec2 vUv;

vec2 barrel(vec2 uv) {
  vec2 c = uv * 2.0 - 1.0;
  float r2 = dot(c, c);
  c *= 1.0 + r2 * 0.045;
  return c * 0.5 + 0.5;
}

void main() {
  vec2 uv = barrel(vUv);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.04, 0.05, 0.045, 1.0);
    return;
  }

  float ca = 0.0012;
  float r = texture2D(tDiffuse, uv + vec2(ca, 0.0)).r;
  float g = texture2D(tDiffuse, uv).g;
  float b = texture2D(tDiffuse, uv - vec2(ca, 0.0)).b;
  vec3 col = vec3(r, g, b);

  vec2 px = uv * resolution;
  float scan = 0.94 + 0.06 * sin(px.y * 3.14159);
  col *= scan;

  float vig = 1.0 - 0.18 * dot(uv * 2.0 - 1.0, uv * 2.0 - 1.0);
  col *= vig;

  col *= vec3(0.97, 1.03, 0.97);
  col *= 1.08;

  float roll = 0.004 * sin(uv.y * 8.0 + time * 1.4);
  col += vec3(0.012, 0.016, 0.01) * roll;

  gl_FragColor = vec4(col, 1.0);
}
`;

export class CrtPass {
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  target: THREE.WebGLRenderTarget;
  mat: THREE.ShaderMaterial;
  private quad: THREE.Mesh;

  constructor(w: number, h: number) {
    this.target = new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });
    this.target.texture.colorSpace = THREE.SRGBColorSpace;
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: this.target.texture },
        resolution: { value: new THREE.Vector2(w, h) },
        time: { value: 0 },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      depthTest: false,
      depthWrite: false,
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat);
    this.scene.add(this.quad);
  }

  resize(w: number, h: number) {
    this.target.setSize(w, h);
    this.mat.uniforms.resolution.value.set(w, h);
  }

  render(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, time: number) {
    this.mat.uniforms.time.value = time;
    renderer.setRenderTarget(this.target);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.target.dispose();
    this.mat.dispose();
    this.quad.geometry.dispose();
  }
}
