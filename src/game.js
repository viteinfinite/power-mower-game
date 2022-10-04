import kaboom from "kaboom"
import levelEnemies from "./level-enemies"
import * as helpers from "./helpers"

kaboom()

for (const level of levelEnemies) {
	for (enemy of level) {
		loadSprite(enemy, `/sprites/${enemy}.png`)
	}
}

loadSprite("grass-tile", "/sprites/grass-tile.png")
loadSprite("mower", "/sprites/mower.png")

loadBean()
loadSound("hit", "/sounds/hit.mp3")
loadSound("shoot", "/sounds/shoot.mp3")
loadSound("explode", "/sounds/explode.mp3")
loadSound("OtherworldlyFoe", "/sounds/OtherworldlyFoe.mp3")

scene("battle", () => {
	const BULLET_SPEED = 1200
	const ENEMY_SPEED = 120
	const PLAYER_SPEED = 480
	const ENEMY_BASE_HEALTH = 4
	const PLAYER_HEALTH = 50

	let currentLevel = 0
	let score = 0

	const music = play("OtherworldlyFoe")

	volume(0.5)

	const sky = add([
		rect(width(), height()),
		color(0, 0, 0),
		opacity(0),
	])

	sky.onUpdate(() => {
		sky.color = rgb(0, 0, 0)
		sky.opacity = 0
	})

	add([
		sprite("grass-tile", {
			tiled: true,
			width: width(),
			height: height()
		}),
		pos(0, 0),
	])

	add([
		text("POWER", { size: 120 }),
		pos(width() / 2, height() / 2),
		origin("center"),
		lifespan(1),
		fixed(),
	])

	add([
		text("MOWER", { size: 160 }),
		pos(width() / 2, height() / 2),
		origin("center"),
		lifespan(4),
		helpers.late(1),
		fixed(),
	])

	const player = add([
		sprite("mower"),
		area(),
		pos(width() / 2, height() - 64),
		health(PLAYER_HEALTH),
		origin("center"),
	])

	onKeyDown("left", () => {
		player.move(-PLAYER_SPEED, 0)
		if (player.pos.x < 0) {
			player.pos.x = width()
		}
	})

	onKeyDown("right", () => {
		player.move(PLAYER_SPEED, 0)
		if (player.pos.x > width()) {
			player.pos.x = 0
		}
	})

	player.onCollide("enemy", (e) => {
		destroy(e)
		play("explode")
		addExplode(e.pos, 1, 24, 1)
		player.hurt(10)
		if (player.hp() <= 0) {
			shake(120)
			destroy(player)
			music.detune(-1200)
			wait(1, () => {
				music.stop()
				go("end", {
					score: score
				})
			})
		}
	})

	player.onHurt(() => {
		healthbar.set(player.hp())
	})

	function addExplode(p, n, rad, size) {
		for (let i = 0; i < n; i++) {
			wait(rand(n * 0.1), () => {
				for (let i = 0; i < 2; i++) {
					add([
						pos(p.add(rand(vec2(-rad), vec2(rad)))),
						rect(4, 4),
						outline(4),
						scale(1 * size, 1 * size),
						lifespan(0.1),
						helpers.grow(rand(48, 72) * size),
						origin("center"),
					])
				}
			})
		}
	}

	function spawnBullet(p) {
		add([
			rect(12, 48),
			area(),
			pos(p),
			origin("center"),
			color(127, 127, 255),
			outline(4),
			move(UP, BULLET_SPEED),
			cleanup(),
			"bullet",
		])
	}

	onKeyPress("space", () => {
		spawnBullet(player.pos.sub(16, 0))
		spawnBullet(player.pos.add(16, 0))
		play("shoot", {
			volume: 0.3,
			detune: rand(-1200, 1200),
		})
	})

	function spawnEnemies() {
		const level = choose([...Array(currentLevel + 1).keys()])
		const enemy = choose(levelEnemies[level])
		add([
			sprite(enemy),
			area(),
			pos(rand(0, width()), 0),
			health(ENEMY_BASE_HEALTH * (currentLevel + 1)),
			origin("bot"),
			"enemy",
			{ speed: rand(ENEMY_SPEED * 0.5 * (currentLevel + 1), ENEMY_SPEED * 1.5 * (currentLevel + 1)) },
		])
		const waitForLevel = {
			0: 1,
			1: 0.7,
			2: 0.5
		}
		wait(waitForLevel[currentLevel], spawnEnemies)
	}

	function updateScore() {
		score += 10
		if (score > 150) {
			currentLevel = 2
		} else if (score > 100) {
			currentLevel = 1
		}
	}

	on("death", "enemy", (e) => {
		destroy(e)
		shake(2)
		addKaboom(e.pos)
		updateScore(e)
	})

	on("hurt", "enemy", (_e) => {
		shake(1)
		play("hit", {
			detune: rand(-1200, 1200),
			speed: rand(0.2, 2),
		})
	})

	const scoreboard = add([
		text(0),
		pos(12, 32),
		fixed(),
		// { score: 0, },
	])

	scoreboard.onUpdate(() => {
		scoreboard.text = score
	})

	onCollide("bullet", "enemy", (b, e) => {
		destroy(b)
		e.hurt(1)
		addExplode(b.pos, 1, 24, 1)
	})

	onUpdate("enemy", (t) => {
		t.move(0, t.speed * 1)
		if (t.pos.y - t.height > height()) {
			destroy(t)
		}
	})

	const healthbar = add([
		rect(width(), 24),
		pos(0, 0),
		color(127, 255, 127),
		fixed(),
		{
			max: PLAYER_HEALTH,
			set(hp) {
				this.width = width() * hp / this.max
				this.flash = true
			},
		},
	])

	healthbar.onUpdate(() => {
		if (healthbar.flash) {
			healthbar.color = rgb(255, 255, 255)
			healthbar.flash = false
		} else {
			healthbar.color = rgb(127, 255, 127)
		}
	})

	spawnEnemies(0)
})

scene("end", ({ score }) => {
	add([
		sprite("grass-tile", {
			tiled: true,
			width: width(),
			height: height()
		}),
		pos(0, 0),
	])

	add([
		text(`Your score: ${score}`, 24),
		origin("center"),
		pos(width() / 2, height() / 2),
	])

	add([
		text("Press ENTER to restart", { width: width() / 2, size: 32 }),
		origin("botleft"),
		pos(24, height() - 24),
	])

	onKeyPress("enter", () => {
		go("battle")
	})
})

go("battle")
