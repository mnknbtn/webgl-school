// 必要なモジュールを読み込み
import * as THREE from "./lib/three.module.js";
import { OrbitControls } from "./lib/OrbitControls.js";

window.addEventListener(
	"DOMContentLoaded",
	() => {
		// 制御クラスのインスタンスを生成
		const app = new App3();
		// 初期化
		app.init();
		// 描画
		app.render();
	},
	false
);

class App3 {
	/**
	 * カメラ定義のための定数
	 */
	static get CAMERA_PARAM() {
		return {
			// fovy は Field of View Y のことで、縦方向の視野角を意味する
			fovy: 50,
			// 描画する空間のアスペクト比（縦横比）
			aspect: window.innerWidth / window.innerHeight,
			// 描画する空間のニアクリップ面（最近面）
			near: 0.1,
			// 描画する空間のファークリップ面（最遠面）
			far: 100.0,
			// カメラの位置
			x: 25.0,
			y: -8.0,
			z: 22.0,
			// カメラの中止点
			lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
		};
	}
	/**
	 * レンダラー定義のための定数
	 */
	static get RENDERER_PARAM() {
		return {
			// レンダラーが背景をリセットする際に使われる背景色
			clearColor: "#000000",
			// レンダラーが描画する領域の横幅
			width: window.innerWidth,
			// レンダラーが描画する領域の縦幅
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
	 * マテリアル定義のための定数
	 */
	static get MATERIAL_PARAM() {
		const colorArray = ["#4550DE", "#7757F5", "#8D45DE"];

		return {
			color: colorArray[Math.floor(Math.random() * colorArray.length)], // マテリアルの基本色
		};
	}

	/**
	 * コンストラクタ
	 * @constructor
	 */
	constructor() {
		this.renderer; // レンダラ
		this.scene; // シーン
		this.camera; // カメラ
		this.directionalLight; // ディレクショナルライト
		this.ambientLight; // アンビエントライト
		this.pointLight; // ポイントライト
		this.material; // マテリアル
		this.boxGeometry; // ボックスジオメトリ
		this.boxArray; // ボックスメッシュ
		this.controls; // オービットコントロール
		this.axesHelper; // 軸ヘルパー

		this.isDown = false; // キーの押下状態を保持するフラグ

		// 再帰呼び出しのための this 固定
		this.render = this.render.bind(this);

		// リサイズイベント
		window.addEventListener(
			"resize",
			() => {
				this.renderer.setSize(window.innerWidth, window.innerHeight);
				this.camera.aspect = window.innerWidth / window.innerHeight;
				this.camera.updateProjectionMatrix();
			},
			false
		);
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
		this.camera = new THREE.PerspectiveCamera(
			App3.CAMERA_PARAM.fovy,
			App3.CAMERA_PARAM.aspect,
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

		// ポイントライト
		function createLight(color, w, h, d, x = 0, y = 0, z = 0) {
			const intensity = 3;
			const light = new THREE.PointLight(color, intensity, 60);

			let geometry = new THREE.BoxGeometry(w, h, d);
			let material = new THREE.MeshBasicMaterial({ color: color });

			material.color.multiplyScalar(intensity);
			let sphere = new THREE.Mesh(geometry, material);
			light.position.x = x;
			light.position.y = y;
			light.position.z = z;
			light.add(sphere);

			return light;
		}

		this.pointLight = createLight("rgb(255, 255, 255)", 6, 6, 6);
		this.scene.add(this.pointLight);

		// ボックスメッシュの生成
		// 右回転グループ
		this.rotateRightGroup = new THREE.Group();

		const BOX_COUNT = 50;
		const TRANSFORM_SCALE = 20.0;
		this.boxGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);

		for (let i = 0; i < BOX_COUNT; ++i) {
			// マテリアル
			this.material = new THREE.MeshPhongMaterial(App3.MATERIAL_PARAM);

			const box = new THREE.Mesh(this.boxGeometry, this.material);
			// 座標をランダムに散らす
			// Math.random() -> 0.0以上〜1.0未満
			box.position.x = (Math.random() * 2.0 - 1.0) * TRANSFORM_SCALE;
			box.position.y = (Math.random() * 2.0 - 1.0) * TRANSFORM_SCALE;
			box.position.z = (Math.random() * 2.0 - 1.0) * TRANSFORM_SCALE;

			// グループに追加する
			this.rotateRightGroup.add(box);

			// シーンに追加する
			this.scene.add(this.rotateRightGroup);
		}

		// 左回転グループ
		this.rotateLeftGroup = new THREE.Group();

		for (let i = 0; i < BOX_COUNT; ++i) {
			// マテリアル
			this.material = new THREE.MeshPhongMaterial(App3.MATERIAL_PARAM);

			const box = new THREE.Mesh(this.boxGeometry, this.material);
			// 座標をランダムに散らす
			// Math.random() -> 0.0以上〜1.0未満
			box.position.x = (Math.random() * 2.0 - 1.0) * TRANSFORM_SCALE;
			box.position.y = (Math.random() * 2.0 - 1.0) * TRANSFORM_SCALE;
			box.position.z = (Math.random() * 2.0 - 1.0) * TRANSFORM_SCALE;

			// グループに追加する
			this.rotateLeftGroup.add(box);

			// シーンに追加する
			this.scene.add(this.rotateLeftGroup);
		}

		// コントロール
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);

		// ヘルパー
		// const axesBarLength = 5.0;
		// this.axesHelper = new THREE.AxesHelper(axesBarLength);
		// this.scene.add(this.axesHelper);
	}

	/**
	 * 描画処理
	 */
	render() {
		// 恒常ループの設定
		requestAnimationFrame(this.render);

		// ポイントライト
		this.pointLight.rotation.x += 0.01;
		this.pointLight.rotation.y += 0.01;

		// ボックスグループ
		this.rotateRightGroup.rotation.y -= 0.001;
		this.rotateLeftGroup.rotation.y += 0.003;

		// コントロールを更新
		this.controls.update();

		// レンダラーで描画
		this.renderer.render(this.scene, this.camera);
	}
}
