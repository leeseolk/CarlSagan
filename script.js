// GSAP

gsap.registerPlugin(Observer);

console.clear();

let sections = document.querySelectorAll("section"),
  background = document.querySelectorAll(".bg"),
  outerWrappers = gsap.utils.toArray(".outer"),
  innerWrappers = gsap.utils.toArray(".inner"),
  currentIndex = -1,
  wrap = gsap.utils.wrap(0, sections.length - 1),
  animating;

let clamp = gsap.utils.clamp(0, sections.length - 1);

gsap.set(outerWrappers, { yPercent: 100 });
gsap.set(innerWrappers, { yPercent: -100 });

function gotoSection(index, direction) {
  index = clamp(index); // make sure it's valid

  // If they are the same, it's either the first or last slide
  if (index === currentIndex) {
    return;
  }

  animating = true;
  let fromTop = direction === -1,
    dFactor = fromTop ? -1 : 1,
    tl = gsap.timeline({
      defaults: { duration: 1.25, ease: "power1.inOut" },
      onComplete: () => (animating = false),
    });
  if (currentIndex >= 0) {
    // The first time this function runs, current is -1
    gsap.set(sections[currentIndex], { zIndex: 0 });
    tl.to(background[currentIndex], { yPercent: -15 * dFactor }).set(
      sections[currentIndex],
      { autoAlpha: 0 }
    );
  }
  gsap.set(sections[index], { autoAlpha: 1, zIndex: 1 });
  tl.fromTo(
    [outerWrappers[index], innerWrappers[index]],
    { yPercent: (i) => (i ? -100 * dFactor : 100 * dFactor) },
    { yPercent: 0 },
    0
  ).fromTo(background[index], { yPercent: 15 * dFactor }, { yPercent: 0 }, 0);

  currentIndex = index;
  return tl;
}

Observer.create({
  type: "wheel, pointer",
  wheelSpeed: -1,
  onDown: () => {
    !animating && gotoSection(currentIndex - 1, -1);
  },
  onUp: () => {
    !animating && gotoSection(currentIndex + 1, 1);
  },
  tolerance: 200,
  allowClicks: true,
  preventDefault: true,
});

gotoSection(0, 1).progress(1);

// SWIPER

var swiper = new Swiper(".swiper", {
  effect: "coverflow",
  grabCursor: true,
  centeredSlides: true,
  initialSlide: 1,
  slidesPerView: "auto",
  coverflowEffect: {
    rotate: 50,
    stretch: 0,
    depth: 100,
    modifier: 1,
    slideShadows: true,
  },
  pagination: {
    el: ".swiper-pagination",
  },
});


const canvas = document.getElementsByTagName("canvas")[0];
const image = document.getElementsByTagName("img")[0];
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

const params = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 1024,
    DENSITY_DISSIPATION: .995,
    VELOCITY_DISSIPATION: .9,
    PRESSURE_ITERATIONS: 10,
    SPLAT_RADIUS: 3 / window.innerHeight,
    color: {r: .8, g: .5, b: .2}
};

const pointer = {
    x: .65 * window.innerWidth,
    y: .5 * window.innerHeight,
    dx: 0,
    dy: 0,
    moved: false,
    firstMove: false // for codepen preview
};
window.setTimeout(() => {
    pointer.firstMove = true;
}, 3000);

let prevTimestamp = Date.now();

const gl = canvas.getContext("webgl");
gl.getExtension("OES_texture_float");


let outputColor, velocity, divergence, pressure;

const vertexShader = createShader(
    document.getElementById("vertShader").innerHTML,
    gl.VERTEX_SHADER);

const splatProgram = createProgram("fragShaderPoint");
const divergenceProgram = createProgram("fragShaderDivergence");
const pressureProgram = createProgram("fragShaderPressure");
const gradientSubtractProgram = createProgram("fragShaderGradientSubtract");
const advectionProgram = createProgram("fragShaderAdvection");
const displayProgram = createProgram("fragShaderDisplay");


initFBOs();
render();
image.style.opacity = "1";


window.addEventListener("resize", () => {
    params.SPLAT_RADIUS = 5 / window.innerHeight;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
});

canvas.addEventListener("click", (e) => {
    pointer.dx = 10;
    pointer.dy = 10;
    pointer.x = e.pageX;
    pointer.y = e.pageY;
    pointer.firstMove = true;
});

canvas.addEventListener("mousemove", (e) => {
    pointer.moved = true;
    pointer.dx = 5 * (e.pageX - pointer.x);
    pointer.dy = 5 * (e.pageY - pointer.y);
    pointer.x = e.pageX;
    pointer.y = e.pageY;
    pointer.firstMove = true;
});

canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    pointer.moved = true;
    pointer.dx = 8 * (e.targetTouches[0].pageX - pointer.x);
    pointer.dy = 8 * (e.targetTouches[0].pageY - pointer.y);
    pointer.x = e.targetTouches[0].pageX;
    pointer.y = e.targetTouches[0].pageY;
    pointer.firstMove = true;
});

function createProgram(elId) {
    const shader = createShader(
        document.getElementById(elId).innerHTML,
        gl.FRAGMENT_SHADER);
    const program = createShaderProgram(vertexShader, shader);
    const uniforms = getUniforms(program);
    return {
        program, uniforms
    }
}

function createShaderProgram(vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Unable to initialize the shader program: " + gl.getProgramInfoLog(program));
        return null;
    }

    return program;
}


function getUniforms(program) {
    let uniforms = [];
    let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i++) {
        let uniformName = gl.getActiveUniform(program, i).name;
        uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
    }
    return uniforms;
}


function createShader(sourceCode, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, sourceCode);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function blit(target) {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,
        -1, 1,
        1, 1,
        1, -1
    ]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    if (target == null) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    } else {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}

function initFBOs() {
    const simRes = getResolution(params.SIM_RESOLUTION);
    const dyeRes = getResolution(params.DYE_RESOLUTION);

    outputColor = createDoubleFBO(dyeRes.width, dyeRes.height);
    velocity = createDoubleFBO(simRes.width, simRes.height);
    divergence = createFBO(simRes.width, simRes.height, gl.RGB);
    pressure = createDoubleFBO(simRes.width, simRes.height, gl.RGB);
}

function getResolution(resolution) {
    let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (aspectRatio < 1)
        aspectRatio = 1. / aspectRatio;

    let min = Math.round(resolution);
    let max = Math.round(resolution * aspectRatio);

    if (gl.drawingBufferWidth > gl.drawingBufferHeight)
        return {width: max, height: min};
    else
        return {width: min, height: max};
}

function createFBO(w, h, type = gl.RGBA) {
    gl.activeTexture(gl.TEXTURE0);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, type, w, h, 0, type, gl.FLOAT, null);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);

    return {
        fbo,
        width: w,
        height: h,
        attach(id) {
            gl.activeTexture(gl.TEXTURE0 + id);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            return id;
        }
    };
}

function createDoubleFBO(w, h, type) {
    let fbo1 = createFBO(w, h, type);
    let fbo2 = createFBO(w, h, type);

    return {
        width: w,
        height: h,
        texelSizeX: 1. / w,
        texelSizeY: 1. / h,
        read: () => {
            return fbo1;
        },
        write: () => {
            return fbo2;
        },
        swap() {
            let temp = fbo1;
            fbo1 = fbo2;
            fbo2 = temp;
        }
    }
}

function render() {
    const dt = (Date.now() - prevTimestamp) / 1000;
    prevTimestamp = Date.now();

    if (!pointer.firstMove) {
        pointer.moved = true;
        const newX = (.65 + .2 * Math.cos(.006 * prevTimestamp) * Math.sin(.008 * prevTimestamp)) * window.innerWidth;
        const newY = (.5 + .12 * Math.sin(.01 * prevTimestamp)) * window.innerHeight;
        pointer.dx = 10 * (newX - pointer.x);
        pointer.dy = 10 * (newY - pointer.y);
        pointer.x = newX;
        pointer.y = newY;
    }

    if (pointer.moved) {
        pointer.moved = false;

        gl.useProgram(splatProgram.program);
        gl.uniform1i(splatProgram.uniforms.u_input_txr, velocity.read().attach(0));
        gl.uniform1f(splatProgram.uniforms.u_ratio, canvas.width / canvas.height);
        gl.uniform2f(splatProgram.uniforms.u_point, pointer.x / canvas.width, 1 - pointer.y / canvas.height);
        gl.uniform3f(splatProgram.uniforms.u_point_value, pointer.dx, -pointer.dy, 1);
        gl.uniform1f(splatProgram.uniforms.u_point_size, params.SPLAT_RADIUS);

        blit(velocity.write());
        velocity.swap();

        gl.uniform1i(splatProgram.uniforms.u_input_txr, outputColor.read().attach(0));
        gl.uniform3f(splatProgram.uniforms.u_point_value, 1. - params.color.r, 0.8 - params.color.g, 0.3 - params.color.b, 0.5);
        blit(outputColor.write());
        outputColor.swap();
    }

    gl.useProgram(divergenceProgram.program);
    gl.uniform2f(divergenceProgram.uniforms.u_vertex_texel, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(divergenceProgram.uniforms.u_velocity_txr, velocity.read().attach(0));
    blit(divergence);

    gl.useProgram(pressureProgram.program);
    gl.uniform2f(pressureProgram.uniforms.u_vertex_texel, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(pressureProgram.uniforms.u_divergence_txr, divergence.attach(0));
    for (let i = 0; i < params.PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(pressureProgram.uniforms.u_pressure_txr, pressure.read().attach(1));
        blit(pressure.write());
        pressure.swap();
    }

    gl.useProgram(gradientSubtractProgram.program);
    gl.uniform2f(gradientSubtractProgram.uniforms.u_vertex_texel, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gradientSubtractProgram.uniforms.u_pressure_txr, pressure.read().attach(0));
    gl.uniform1i(gradientSubtractProgram.uniforms.u_velocity_txr, velocity.read().attach(1));
    blit(velocity.write());
    velocity.swap();

    gl.useProgram(advectionProgram.program);
    gl.uniform2f(advectionProgram.uniforms.u_vertex_texel, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform2f(advectionProgram.uniforms.u_output_textel, velocity.texelSizeX, velocity.texelSizeY);

    gl.uniform1i(advectionProgram.uniforms.u_velocity_txr, velocity.read().attach(0));
    gl.uniform1i(advectionProgram.uniforms.u_input_txr, velocity.read().attach(0));
    gl.uniform1f(advectionProgram.uniforms.u_dt, dt);
    gl.uniform1f(advectionProgram.uniforms.u_dissipation, params.VELOCITY_DISSIPATION);
    blit(velocity.write());
    velocity.swap();

    gl.uniform2f(advectionProgram.uniforms.u_output_textel, outputColor.texelSizeX, outputColor.texelSizeY);
    gl.uniform1i(advectionProgram.uniforms.u_velocity_txr, velocity.read().attach(0));
    gl.uniform1i(advectionProgram.uniforms.u_input_txr, outputColor.read().attach(1));
    gl.uniform1f(advectionProgram.uniforms.u_dissipation, params.DENSITY_DISSIPATION);
    blit(outputColor.write());
    outputColor.swap();

    gl.useProgram(displayProgram.program);
    gl.uniform1i(displayProgram.uniforms.u_output_texture, outputColor.read().attach(0));
    blit();

    requestAnimationFrame(render);
}
