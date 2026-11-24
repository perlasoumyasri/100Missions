// Based on vgpu's fft-ocean present.wgsl (MIT): scene + bloom, linear → sRGB.
// Added for NEREID: a deep-water ground colour, a faint haze along the horizon,
// a soft vignette, fine animated grain and a visibility fade for intro and cuts.

struct PresentUniforms {
  ground: vec4f,  // background colour (linear), a = visibility
  haze: vec4f,    // horizon haze colour (linear), a = horizon y (0 top, 1 bottom)
  params: vec4f,  // time, grain amount, vignette amount, aspect
  flash: vec4f,   // flash colour (linear, premultiplied by amount), haze weight
};

@group(0) @binding(0) var sceneHDR: texture_2d<f32>;
@group(0) @binding(1) var bloomTexture: texture_2d<f32>;
@group(0) @binding(2) var linearSampler: sampler;
@group(0) @binding(3) var<uniform> p: PresentUniforms;

fn LinearTosRGB(value: vec4f) -> vec4f {
  let lt = value.rgb * 12.92;
  let gt = 1.055 * pow(value.rgb, vec3f(0.41666)) - vec3f(0.055);
  let rgb = select(gt, lt, value.rgb <= vec3f(0.0031308));
  return vec4f(rgb, value.a);
}

fn hash(q: vec2f) -> f32 {
  let h = dot(q, vec2f(127.1, 311.7));
  return fract(sin(h) * 43758.5453123);
}

@fragment fn fs_main(@location(0) uv: vec2f, @builtin(position) frag: vec4f) -> @location(0) vec4f {
  let scene = textureSample(sceneHDR, linearSampler, uv);
  let bloom = textureSample(bloomTexture, linearSampler, uv);

  // Haze hugs the horizon, a little thicker below it (looking into the water).
  let dy = uv.y - p.haze.a;
  let haze = exp(-abs(dy) * select(9.0, 5.0, dy > 0.0)) * 0.9 * p.flash.w;
  var color = p.ground.rgb + p.haze.rgb * haze + scene.rgb + bloom.rgb + p.flash.rgb;

  // Vignette, wider than tall.
  let c = (uv - vec2f(0.5)) * vec2f(p.params.w, 1.0) / max(p.params.w, 1.0);
  color *= 1.0 - p.params.z * smoothstep(0.25, 0.95, length(c) * 1.35);
  color *= p.ground.a;

  var srgb = LinearTosRGB(vec4f(max(color, vec3f(0.0)), 1.0)).rgb;
  // Grain in display space so it sits evenly over darks and lights.
  let g = hash(floor(frag.xy) + fract(p.params.x * 7.31) * 113.0) - 0.5;
  srgb += g * p.params.y;
  return vec4f(srgb, 1.0);
}
