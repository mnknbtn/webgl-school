import * as THREE from "./lib/three.module.js";

import { OrbitControls } from "./lib/OrbitControls.js";
import { Fan } from "./fan.js";

window.addEventListener(
	"DOMContentLoaded",
	() => {
		const app = new App3();
		// 画像をロードしテクスチャを初期化する（Promise による非同期処理） @@@
		app.load().then(() => {
			// ロードが終わってから初期化し、描画する
			app.init();
			app.render();
		});
	},
	false
);

class App3 {
	/**
	 * カメラで撮影する範囲を表す定数 @@@
	 */
	static get CAMERA_SCALE() {
		return 5.0;
	}
	/**
	 * カメラ定義のための定数 @@@
	 */
	static get CAMERA_PARAM() {
		// 平行投影（正射影）変換用のパラメータを計算する
		const aspect = window.innerWidth / window.innerHeight; // アスペクト比
		const scale = App3.CAMERA_SCALE; // 切り取る空間の広さ（スケール）
		const horizontal = scale * aspect; // 横方向のスケール
		const vertiacal = scale; // 縦方向のスケール
		return {
			left: -horizontal, // 切り取る空間の左端までの距離
			right: horizontal, // 切り取る空間の右端までの距離
			top: vertiacal, // 切り取る空間の上端までの距離
			bottom: -vertiacal, // 切り取る空間の下端までの距離
			near: 0.1,
			far: 30.0,
			x: 10.0,
			y: 3.0,
			z: 8.0,
			lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
		};
	}
	/**
	 * レンダラー定義のための定数
	 */
	static get RENDERER_PARAM() {
		return {
			clearColor: "#D0FAFA",
			width: window.innerWidth,
			height: window.innerHeight,
		};
	}
	/**
	 * ディレクショナルライト定義のための定数
	 */
	static get DIRECTIONAL_LIGHT_PARAM() {
		return {
			color: 0xffffff, // 光の色
			intensity: 1.0, // 光の強度
			x: 1.0, // 光の向きを表すベクトルの X 要素
			y: 1.0, // 光の向きを表すベクトルの Y 要素
			z: 1.0, // 光の向きを表すベクトルの Z 要素
		};
	}
	/**
	 * アンビエントライト定義のための定数
	 */
	static get AMBIENT_LIGHT_PARAM() {
		return {
			color: 0xffffff, // 光の色
			intensity: 0.2, // 光の強度
		};
	}

	/**
	 * コンストラクタ
	 * @constructor
	 */
	constructor() {
		this.renderer;
		this.scene;
		this.camera;
		this.directionalLight;
		this.ambientLight;
		this.controls;
		this.axesHelper;
		this.texture;
		this.ground;
		this.fan01;
		this.fan02;
		this.fan03;
		this.swingCount = 0;

		this.render = this.render.bind(this);

		// リサイズイベント
		window.addEventListener(
			"resize",
			() => {
				this.render.setSize(window.innerWidth, window.innerHeight);

				const aspect = window.innerWidth / window.innerHeight;
				const scale = App3.CAMERA_SCALE;
				const horizontal = scale;
				const vertical = scale;
				this.camera.left = -horizontal;
				this.camera.right = horizontal;
				this.camera.top = vertical;
				this.camera.bottom = -vertical;
				this.camera.updateProjectionMatrix();
			},
			false
		);
	}

	/**
	 * アセット（素材）のロードを行う Promise @@@
	 */
	load() {
		return new Promise((resolve) => {
			// 読み込む画像のパス
			const imagePath = "./wing_texture02.jpg";
			// テクスチャ用のローダーのインスタンスを生成
			const loader = new THREE.TextureLoader();
			// ローダーの load メソッドに読み込む画像のパスと、ロード完了時のコールバックを指定
			loader.load(imagePath, (texture) => {
				// コールバック関数の引数として、初期化済みのテクスチャオブジェクトが渡されてくる
				this.texture = texture;
				// Promise を解決
				resolve();
			});
		});
	}

	/**
	 * 初期化処理
	 */
	init() {
		// レンダラー
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setClearColor(
			new THREE.Color(App3.RENDERER_PARAM.clearColor)
		);
		this.renderer.setSize(
			App3.RENDERER_PARAM.width,
			App3.RENDERER_PARAM.height
		);
		const wrapper = document.querySelector("#webgl");
		wrapper.appendChild(this.renderer.domElement);

		// シーン
		this.scene = new THREE.Scene();

		// カメラ
		this.camera = new THREE.OrthographicCamera(
			App3.CAMERA_PARAM.left,
			App3.CAMERA_PARAM.right,
			App3.CAMERA_PARAM.top,
			App3.CAMERA_PARAM.bottom,
			App3.CAMERA_PARAM.near,
			App3.CAMERA_PARAM.far
		);
		this.camera.position.set(
			App3.CAMERA_PARAM.x,
			App3.CAMERA_PARAM.y,
			App3.CAMERA_PARAM.z
		);
		this.camera.lookAt(App3.CAMERA_PARAM.lookAt);

		// ディレクショナルライト（平行光源）
		this.directionalLight = new THREE.DirectionalLight(
			App3.DIRECTIONAL_LIGHT_PARAM.color,
			App3.DIRECTIONAL_LIGHT_PARAM.intensity
		);
		this.directionalLight.position.set(
			App3.DIRECTIONAL_LIGHT_PARAM.x,
			App3.DIRECTIONAL_LIGHT_PARAM.y,
			App3.DIRECTIONAL_LIGHT_PARAM.z
		);
		this.scene.add(this.directionalLight);

		// アンビエントライト（環境光）
		this.ambientLight = new THREE.AmbientLight(
			App3.AMBIENT_LIGHT_PARAM.color,
			App3.AMBIENT_LIGHT_PARAM.intensity
		);
		this.scene.add(this.ambientLight);

		// 地面
		const groundGeometory = new THREE.CylinderGeometry(5, 5, 10, 32);
		const groundMaterial = new THREE.MeshPhongMaterial({
			color: "#FFFFBF",
		});
		const ground = new THREE.Mesh(groundGeometory, groundMaterial);
		ground.position.y = -10 / 2 - 3;
		ground.position.z = 0;
		this.scene.add(ground);

		// 扇風機
		this.fan01 = new Fan({
			fanColor: "#31AE61",
			leafColor: "#31AE61",
			pointColor: "#F2CB05",
			wingColor: "#FFFFFF",
			fanPositionX: 0.8,
			fanPositionZ: 0.8,
			pipeHeight: 2.2,
			leafCount: 2,
			wingTexture: this.texture,
			wingSpeed: 0.6,
			headSpeed: 200,
		});
		this.scene.add(this.fan01);

		this.fan02 = new Fan({
			fanColor: "#277A44",
			leafColor: "#277A44",
			pointColor: "#F2CB05",
			wingColor: "#4B6AFA",
			fanPositionX: 1,
			fanPositionZ: -2.5,
			pipeHeight: 3.2,
			leafCount: 4,
			wingTexture: false,
			wingSpeed: 0.3,
			headSpeed: 180,
		});
		this.scene.add(this.fan02);

		this.fan03 = new Fan({
			fanColor: "#22AE40",
			leafColor: "#22AE40",
			pointColor: "#F2CB05",
			wingColor: "#DE2361",
			fanPositionX: -2,
			fanPositionZ: 1,
			pipeHeight: 3,
			leafCount: 4,
			wingTexture: false,
			wingSpeed: 0.4,
			headSpeed: 220,
		});
		this.scene.add(this.fan03);

		// コントロール
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);

		// ヘルパー
		// const axesBarLength = 15.0;
		// this.axesHelper = new THREE.AxesHelper(axesBarLength);
		// this.scene.add(this.axesHelper);
	}

	/**
	 * 描画処理
	 */
	render() {
		// 恒常ループ
		requestAnimationFrame(this.render);

		// コントロールを更新
		this.controls.update();

		this.fan01.update();
		this.fan02.update();
		this.fan03.update();

		// レンダラーで描画
		this.renderer.render(this.scene, this.camera);
	}
}
