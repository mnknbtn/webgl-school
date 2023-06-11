import * as THREE from "./lib/three.module.js";

export class Fan extends THREE.Group {
	/**
	 * @class
	 * @constructor
	 * @param {String} fanColor
	 * @param {String} leafColor
	 * @param {String} pointColor
	 * @param {String} wingColor
	 * @param {Number} [fanPositionX=0]
	 * @param {Number} [fanPositionZ=0]
	 * @param {Number} [pipeHeight=2.2]
	 * @param {Number} [leafCount=2]
	 * @param {boolean} [wingTexture=false]
	 * @param {Number} [swingSpeed=0.6]
	 * @param {Number} [headSpeed=200]
	 */

	/**
	 * コンストラクタ
	 * @constructor
	 */
	constructor({
		fanColor,
		leafColor,
		pointColor,
		wingColor,
		fanPositionX,
		fanPositionZ,
		pipeHeight,
		leafCount,
		wingTexture,
		wingSpeed,
		headSpeed,
	}) {
		super();

		this.fanColor = fanColor;
		this.leafColor = leafColor;
		this.pointColor = pointColor;
		this.wingColor = wingColor;
		this.fanPositionX = fanPositionX;
		this.fanPositionZ = fanPositionZ;
		this.pipeHeight = pipeHeight;
		this.leafCount = leafCount;
		this.wingTexture = wingTexture;
		this.wingSpeed = wingSpeed;
		this.headSpeed = headSpeed;
		this.fanGroup;
		this.headGroup;
		this.wingGroup;
		this.swingCount = 0;

		// 扇風機
		this.fanGroup = new THREE.Group();
		this.fanGroup.position.x = this.fanPositionX;
		this.fanGroup.position.z = this.fanPositionZ;
		this.fanGroup.rotation.y = (Math.PI / 180) * 45;

		// 支柱
		const pipeGeometory = new THREE.CylinderGeometry(
			0.12,
			0.12,
			this.pipeHeight,
			30
		);
		const pipeMaterial = new THREE.MeshPhongMaterial({
			color: this.fanColor,
		});
		const pipe = new THREE.Mesh(pipeGeometory, pipeMaterial);
		pipe.position.y = this.pipeHeight / 2 - 3;
		pipe.position.z = 0;
		this.fanGroup.add(pipe);

		// 葉っぱ
		for (let i = 1; i <= this.leafCount; i++) {
			const leafGeometory = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 32);
			const leafMaterial = new THREE.MeshPhongMaterial({
				color: this.leafColor,
			});
			const leaf = new THREE.Mesh(leafGeometory, leafMaterial);
			leaf.rotation.x = Math.PI / 2;
			if (i % 2 === 0) {
				leaf.position.x = 0.4;
			} else {
				leaf.position.x = -0.4;
			}
			if (i > 2) {
				leaf.position.y = 1.4 - 3;
			} else {
				leaf.position.y = 0.4 - 3;
			}
			leaf.position.z = 0;
			this.fanGroup.add(leaf);
		}

		// 上部
		this.headGroup = new THREE.Group();
		this.fanGroup.add(this.headGroup);

		// モーター
		const shaftGeometory = new THREE.CylinderGeometry(0.3, 0.3, 0.7, 30);
		const shaftMaterial = new THREE.MeshPhongMaterial({
			color: this.fanColor,
		});
		const shaft = new THREE.Mesh(shaftGeometory, shaftMaterial);
		shaft.rotation.x = Math.PI / 2;
		shaft.position.y = pipe.position.y + this.pipeHeight / 2;
		shaft.position.z = 0.1;
		this.headGroup.add(shaft);

		const shaftPipeGeometory = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 30);
		const shaftPipeMaterial = new THREE.MeshPhongMaterial({
			color: this.pointColor,
		});
		const shaftPipe = new THREE.Mesh(shaftPipeGeometory, shaftPipeMaterial);
		shaftPipe.rotation.x = Math.PI / 2;
		shaftPipe.position.y = shaft.position.y;
		shaftPipe.position.z = shaft.position.z + 0.4;
		this.headGroup.add(shaftPipe);

		// 羽
		this.wingGroup = new THREE.Group();
		this.wingGroup.position.y = shaft.position.y;
		this.headGroup.add(this.wingGroup);

		const wingBaseGeometory = new THREE.SphereGeometry(
			0.2,
			30,
			30,
			0,
			Math.PI * 2,
			4.66212349792725,
			2.95938027968159
		);
		const wingBaseMaterial = new THREE.MeshPhongMaterial({
			color: this.pointColor,
		});
		const wingBase = new THREE.Mesh(wingBaseGeometory, wingBaseMaterial);
		wingBase.rotation.x = Math.PI / 2;
		wingBase.position.z = shaftPipe.position.z + 0.08;
		this.wingGroup.add(wingBase);

		const wingShaftGeometory = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 30);
		const wingShaftMaterial = new THREE.MeshPhongMaterial({
			color: this.pointColor,
		});
		const wingShaft = new THREE.Mesh(wingShaftGeometory, wingShaftMaterial);
		wingShaft.rotation.x = Math.PI / 2;
		wingShaft.position.z = shaftPipe.position.z + 0.1;
		this.wingGroup.add(wingShaft);

		for (let i = 0; i < 4; i++) {
			const wingGeometory = new THREE.CylinderGeometry(
				0.5,
				0.5,
				0.05,
				32,
				1,
				false,
				0,
				Math.PI
			);
			const wingMaterial = new THREE.MeshPhongMaterial({
				color: this.wingColor,
			});
			if (this.wingTexture) {
				wingMaterial.map = this.wingTexture;
			}

			const wing = new THREE.Mesh(wingGeometory, wingMaterial);
			wing.rotation.x = Math.PI / 2;
			wing.rotation.y = (Math.PI / 2) * (i + 1);
			wing.position.z = wingBase.position.z;
			if (i === 0) {
				wing.position.x = 0.5;
				wing.position.y = wingShaft.position.y;
			} else if (i === 1) {
				wing.position.y = wingShaft.position.y + 0.5;
			} else if (i === 2) {
				wing.position.x = -0.5;
				wing.position.y = wingShaft.position.y;
			} else {
				wing.position.y = wingShaft.position.y - 0.5;
			}

			this.wingGroup.add(wing);
		}

		this.add(this.fanGroup);
	}

	update() {
		this.wingGroup.rotation.z += this.wingSpeed;
		this.headGroup.rotation.y = Math.sin(++this.swingCount / this.headSpeed);
	}
}
