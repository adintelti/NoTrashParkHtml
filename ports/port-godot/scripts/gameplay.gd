extends Control

class EnemyState:
	var id: int = 0
	var node: TextureRect
	var path_index: int = 0
	var grid_position: Vector2 = Vector2.ZERO
	var speed: float = 0.0
	var reward: int = 0
	var pivot: Vector2 = Vector2.ZERO
	var hp: int = 1
	var max_hp: int = 1
	var slow_factor: float = 1.0
	var slow_until: float = 0.0

class TowerState:
	var id: int = 0
	var node: TextureRect
	var range_node: TextureRect
	var tile_position: Vector2i = Vector2i.ZERO
	var tower_type: String = ""
	var cost: int = 0
	var range: float = 0.0
	var cooldown: float = 0.0
	var damage: int = 0
	var fire_rate: float = 0.0
	var projectile_speed: float = 0.0
	var slow_factor: float = 1.0
	var slow_duration: float = 0.0
	var splash: float = 0.0

class ProjectileState:
	var id: int = 0
	var node: TextureRect
	var source_tower_id: int = 0
	var target_id: int = 0
	var grid_position: Vector2 = Vector2.ZERO
	var damage: int = 0
	var speed: float = 0.0
	var slow_factor: float = 1.0
	var slow_duration: float = 0.0
	var splash: float = 0.0
	var pivot: Vector2 = Vector2.ZERO

class ImpactState:
	var node: TextureRect
	var grid_position: Vector2 = Vector2.ZERO
	var life: float = 0.0
	var pivot: Vector2 = Vector2.ZERO

const MAIN_MENU_SCENE: String = "res://scenes/main_menu.tscn"
const COLS: int = 12
const ROWS: int = 9
const TILE_SIZE: Vector2 = Vector2(105, 105)
const ENEMY_PIVOT: Vector2 = Vector2(27, 27)
const TOWER_PIVOT: Vector2 = Vector2(21, 52)
const PROJECTILE_PIVOT: Vector2 = Vector2(9, 9)
const PROJECTILE_SPLASH_PIVOT: Vector2 = Vector2(11, 11)
const IMPACT_PIVOT: Vector2 = Vector2(31, 31)
const RANGE_RING_PIVOT: Vector2 = Vector2(215, 215)
const RANGE_RING_BASE_DIAMETER: float = 430.0
const INITIAL_WAVE_COOLDOWN: float = 1.2
const BETWEEN_WAVE_COOLDOWN: float = 2.4

const TILE_PARK_A: Texture2D = preload("res://assets/tiles/park_terrain_detail_a.png")
const TILE_PARK_B: Texture2D = preload("res://assets/tiles/park_terrain_detail_b.png")
const TILE_PARK_C: Texture2D = preload("res://assets/tiles/park_terrain_detail_c.png")
const TILE_PATH: Texture2D = preload("res://assets/tiles/park_path.png")
const TILE_BLOCKED: Texture2D = preload("res://assets/tiles/park_terrain_blocked.png")

const ENEMY_RUNNER_TEXTURE: Texture2D = preload("res://assets/enemies/enemy_runner.png")
const ENEMY_BRUTE_TEXTURE: Texture2D = preload("res://assets/enemies/enemy_brute.png")
const ENEMY_SHIELD_TEXTURE: Texture2D = preload("res://assets/enemies/enemy_shield.png")

const TOWER_SENTINEL_TEXTURE: Texture2D = preload("res://assets/towers/tower_sentinel.png")
const TOWER_SLOW_TEXTURE: Texture2D = preload("res://assets/towers/tower_slow.png")
const TOWER_SPLASH_TEXTURE: Texture2D = preload("res://assets/towers/tower_splash.png")
const TOWER_FLAME_TEXTURE: Texture2D = preload("res://assets/towers/tower_flame.png")

const PROJECTILE_DEFAULT_TEXTURE: Texture2D = preload("res://assets/projectiles/projectile_default.png")
const PROJECTILE_SLOW_TEXTURE: Texture2D = preload("res://assets/projectiles/projectile_slow.png")
const PROJECTILE_SPLASH_TEXTURE: Texture2D = preload("res://assets/projectiles/projectile_splash.png")
const PROJECTILE_FLAME_TEXTURE: Texture2D = preload("res://assets/projectiles/projectile_flame.png")

const IMPACT_TEXTURE: Texture2D = preload("res://assets/effects/impact_frame_1.png")
const RANGE_RING_TEXTURE: Texture2D = preload("res://assets/effects/range_ring_4_cells.png")

var selected_tower: String = "sentinel"
var wave_limit: int = 12
var wave: int = 0
var lives: int = 10
var coins: int = 300
var session_defeated: int = 0
var wave_defeated: int = 0
var spawn_remaining: int = 0
var spawn_timer: float = 0.0
var wave_cooldown: float = INITIAL_WAVE_COOLDOWN
var wave_in_progress: bool = false
var paused: bool = false
var game_over: bool = false
var victory_pending: bool = false
var session_time: float = 0.0
var sim_time: float = 0.0
var next_enemy_id: int = 1
var next_tower_id: int = 1
var next_projectile_id: int = 1
var speed_multiplier: float = 1.0
var enemies: Array[EnemyState] = []
var placed_towers: Array[TowerState] = []
var projectiles: Array[ProjectileState] = []
var impacts: Array[ImpactState] = []
var occupied_tiles: Array[Vector2i] = []

var path_tiles: Array[Vector2i] = [
	Vector2i(3, 0),
	Vector2i(3, 1),
	Vector2i(3, 2),
	Vector2i(4, 2),
	Vector2i(4, 3),
	Vector2i(5, 3),
	Vector2i(6, 3),
	Vector2i(6, 4),
	Vector2i(7, 4),
	Vector2i(8, 4),
	Vector2i(8, 5),
	Vector2i(8, 6),
	Vector2i(9, 6),
	Vector2i(10, 6),
	Vector2i(10, 7),
	Vector2i(10, 8)
]
var blocked_tiles: Array[Vector2i] = [
	Vector2i(0, 1),
	Vector2i(1, 4),
	Vector2i(10, 1),
	Vector2i(11, 6),
	Vector2i(2, 8),
	Vector2i(9, 8)
]

@onready var _board: GridContainer = get_node("AppBackground/GameFrame/GameLayout/BoardStage/Board")
@onready var _range_layer: Control = get_node("AppBackground/GameFrame/GameLayout/BoardStage/RangeLayer")
@onready var _tower_layer: Control = get_node("AppBackground/GameFrame/GameLayout/BoardStage/TowerLayer")
@onready var _enemy_layer: Control = get_node("AppBackground/GameFrame/GameLayout/BoardStage/EnemyLayer")
@onready var _projectile_layer: Control = get_node("AppBackground/GameFrame/GameLayout/BoardStage/ProjectileLayer")
@onready var _effect_layer: Control = get_node("AppBackground/GameFrame/GameLayout/BoardStage/EffectLayer")
@onready var _lives_label: Label = get_node("AppBackground/GameFrame/GameLayout/BoardStage/TopHud/LivesPill/LivesLabel")
@onready var _wave_label: Label = get_node("AppBackground/GameFrame/GameLayout/BoardStage/TopHud/WavePill/WaveLabel")
@onready var _defeated_label: Label = get_node("AppBackground/GameFrame/GameLayout/BoardStage/TopHud/DefeatedPill/DefeatedLabel")
@onready var _time_label: Label = get_node("AppBackground/GameFrame/GameLayout/BoardStage/TopHud/TimePill/TimeLabel")
@onready var _wave_banner: PanelContainer = get_node("AppBackground/GameFrame/GameLayout/BoardStage/WaveBanner")
@onready var _wave_banner_label: Label = get_node("AppBackground/GameFrame/GameLayout/BoardStage/WaveBanner/WaveBannerLabel")
@onready var _floating_message: PanelContainer = get_node("AppBackground/GameFrame/GameLayout/BoardStage/FloatingMessage")
@onready var _floating_message_label: Label = get_node("AppBackground/GameFrame/GameLayout/BoardStage/FloatingMessage/FloatingMessageLabel")
@onready var _floating_message_timer: Timer = get_node("FloatingMessageTimer")
@onready var _wave_banner_timer: Timer = get_node("WaveBannerTimer")
@onready var _difficulty_value: Label = get_node("AppBackground/GameFrame/GameLayout/ShopPanel/ShopContent/SessionInfo/SessionRows/DifficultyValue")
@onready var _waves_value: Label = get_node("AppBackground/GameFrame/GameLayout/ShopPanel/ShopContent/SessionInfo/SessionRows/WavesValue")
@onready var _cards_value: Label = get_node("AppBackground/GameFrame/GameLayout/ShopPanel/ShopContent/SessionInfo/SessionRows/CardsValue")
@onready var _status_label: Label = get_node("AppBackground/GameFrame/GameLayout/ShopPanel/ShopContent/StatusLabel")
@onready var _money_label: Label = get_node("AppBackground/GameFrame/GameLayout/ShopPanel/ShopContent/ShopTop/MoneyPanel/MoneyLabel")
@onready var _restart_button: Button = get_node("AppBackground/GameFrame/GameLayout/ShopPanel/ShopContent/ShopTop/ShopActions/RestartButton")
@onready var _menu_button: Button = get_node("AppBackground/GameFrame/GameLayout/ShopPanel/ShopContent/ShopTop/ShopActions/MenuButton")
@onready var _delete_button: Button = get_node("AppBackground/GameFrame/GameLayout/ShopPanel/ShopContent/ToolsGrid/DeleteButton")
@onready var _pause_button: Button = get_node("AppBackground/GameFrame/GameLayout/ShopPanel/ShopContent/ControlRow/PauseButton")
@onready var _speed_button: Button = get_node("AppBackground/GameFrame/GameLayout/ShopPanel/ShopContent/ControlRow/SpeedButton")
@onready var _tower_buttons: Dictionary = {
	"sentinel": get_node("AppBackground/GameFrame/GameLayout/ShopPanel/ShopContent/TowerGrid/SentinelButton"),
	"slow": get_node("AppBackground/GameFrame/GameLayout/ShopPanel/ShopContent/TowerGrid/SlowButton"),
	"splash": get_node("AppBackground/GameFrame/GameLayout/ShopPanel/ShopContent/TowerGrid/SplashButton"),
	"flame": get_node("AppBackground/GameFrame/GameLayout/ShopPanel/ShopContent/TowerGrid/FlameButton")
}

func _ready() -> void:
	_floating_message.hide()
	_wave_banner.hide()
	_build_board()
	_connect_buttons()
	_apply_tower_button_icons()
	_select_tower(selected_tower)
	_start_run()

func _process(delta: float) -> void:
	if game_over or victory_pending:
		return

	session_time += delta
	if paused:
		_sync_hud()
		return

	var dt: float = delta * speed_multiplier
	sim_time += dt
	_update_wave_flow(dt)
	if game_over or victory_pending:
		_sync_hud()
		return
	_update_towers(dt)
	_update_projectiles(dt)
	_update_impacts(dt)
	_sync_hud()

func _start_run() -> void:
	_clear_enemies()
	_clear_projectiles()
	_clear_impacts()
	_clear_towers()
	wave_limit = maxi(1, GameSession.wave_limit)
	wave = 0
	lives = 10
	coins = 300
	session_defeated = 0
	wave_defeated = 0
	spawn_remaining = 0
	spawn_timer = 0.0
	wave_cooldown = INITIAL_WAVE_COOLDOWN
	wave_in_progress = false
	paused = false
	game_over = false
	victory_pending = false
	session_time = 0.0
	sim_time = 0.0
	next_enemy_id = 1
	next_tower_id = 1
	next_projectile_id = 1
	speed_multiplier = 1.0
	_pause_button.button_pressed = false
	_pause_button.text = "Pause"
	_speed_button.button_pressed = false
	_speed_button.text = "1x"
	_sync_session_labels()
	_sync_hud()
	_show_status("Preparando onda 1.")

func _update_wave_flow(dt: float) -> void:
	if wave_in_progress:
		_update_spawn(dt)
		_move_enemies(dt)
		if spawn_remaining <= 0 and enemies.is_empty():
			_complete_current_wave()
		return

	wave_cooldown -= dt
	if wave_cooldown <= 0.0:
		_start_next_wave()

func _start_next_wave() -> void:
	if wave >= wave_limit:
		_finish_victory()
		return

	wave += 1
	wave_defeated = 0
	spawn_remaining = 6 + wave * 2
	spawn_timer = 0.0
	wave_in_progress = true
	_show_wave_banner("Onda %d" % wave)
	_show_status("Onda %d iniciada." % wave)

func _update_spawn(dt: float) -> void:
	if spawn_remaining <= 0:
		return

	spawn_timer -= dt
	if spawn_timer > 0.0:
		return

	_spawn_enemy()
	spawn_remaining -= 1
	spawn_timer = maxf(0.36, 0.86 - float(wave) * 0.025)

func _complete_current_wave() -> void:
	wave_in_progress = false
	session_defeated += wave_defeated
	wave_defeated = 0
	_show_wave_banner("Onda %d concluida" % wave)

	if wave >= wave_limit:
		_finish_victory()
		return

	wave_cooldown = BETWEEN_WAVE_COOLDOWN
	_show_status("Onda %d concluida. Proxima onda em breve." % wave)

func _finish_victory() -> void:
	victory_pending = true
	wave_in_progress = false
	spawn_remaining = 0
	_clear_enemies()
	_clear_projectiles()
	_clear_impacts()
	_show_wave_banner("Parque Protegido!")
	_show_status("Todas as ondas foram concluidas.")
	_sync_hud()

func _end_game() -> void:
	game_over = true
	wave_in_progress = false
	spawn_remaining = 0
	_clear_enemies()
	_clear_projectiles()
	_clear_impacts()
	_show_wave_banner("Fim de jogo")
	_show_status("O parque perdeu todas as vidas.")
	_sync_hud()

func _spawn_enemy() -> void:
	var tier: int = _get_enemy_tier()
	var enemy_texture: Texture2D = _get_enemy_texture(tier)
	var enemy_node: TextureRect = TextureRect.new()
	enemy_node.name = "Enemy_%03d" % next_enemy_id
	enemy_node.texture = enemy_texture
	enemy_node.size = enemy_texture.get_size()
	enemy_node.stretch_mode = TextureRect.STRETCH_KEEP
	enemy_node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_enemy_layer.add_child(enemy_node)

	var enemy_data: EnemyState = EnemyState.new()
	enemy_data.id = next_enemy_id
	enemy_data.node = enemy_node
	enemy_data.path_index = 0
	enemy_data.grid_position = _get_path_point(0)
	enemy_data.speed = _get_enemy_speed(tier)
	enemy_data.reward = _get_enemy_reward(tier)
	enemy_data.pivot = _get_enemy_pivot(tier)
	enemy_data.max_hp = _get_enemy_max_hp(tier)
	enemy_data.hp = enemy_data.max_hp
	enemy_data.slow_factor = 1.0
	enemy_data.slow_until = 0.0
	next_enemy_id += 1
	enemies.append(enemy_data)
	_position_enemy(enemy_data)

func _get_enemy_tier() -> int:
	if wave > 4 and spawn_remaining % 5 == 0:
		return 2
	if wave > 2 and spawn_remaining % 3 == 0:
		return 1
	return 0

func _get_enemy_speed(tier: int) -> float:
	var base_speed: float = 1.22
	if tier == 1:
		base_speed = 0.78
	elif tier == 2:
		base_speed = 0.64
	return base_speed * (1.0 + minf(float(wave), 8.0) * 0.025)

func _get_enemy_reward(tier: int) -> int:
	if tier == 1:
		return 14
	if tier == 2:
		return 18
	return 8

func _get_enemy_max_hp(tier: int) -> int:
	var base_hp: int = 42
	if tier == 1:
		base_hp = 78
	elif tier == 2:
		base_hp = 105
	return int(round(float(base_hp) * (1.0 + float(wave) * 0.12)))

func _move_enemies(dt: float) -> void:
	var completed_enemies: Array[EnemyState] = []
	for enemy_data in enemies:
		var active_slow_factor: float = enemy_data.slow_factor if enemy_data.slow_until > sim_time else 1.0
		var distance_left: float = enemy_data.speed * active_slow_factor * dt
		var grid_position: Vector2 = enemy_data.grid_position
		var path_index: int = enemy_data.path_index

		while distance_left > 0.0 and path_index < path_tiles.size() - 1:
			var target: Vector2 = _get_path_point(path_index + 1)
			var delta_to_target: Vector2 = target - grid_position
			var segment_length: float = delta_to_target.length()

			if segment_length <= distance_left:
				grid_position = target
				path_index += 1
				distance_left -= segment_length
			else:
				grid_position += delta_to_target.normalized() * distance_left
				distance_left = 0.0

		enemy_data.grid_position = grid_position
		enemy_data.path_index = path_index
		_position_enemy(enemy_data)

		if path_index >= path_tiles.size() - 1:
			completed_enemies.append(enemy_data)
		elif enemy_data.slow_until > sim_time:
			enemy_data.node.modulate = Color(0.55, 0.85, 1.0, 1.0)
		else:
			enemy_data.node.modulate = Color.WHITE

	for completed_enemy_data in completed_enemies:
		_remove_enemy(completed_enemy_data, false)
		lives -= 1
		if lives <= 0:
			_end_game()
			return

func _remove_enemy(enemy_data: EnemyState, award_reward: bool) -> void:
	var enemy_node: Node = enemy_data.node
	if is_instance_valid(enemy_node):
		enemy_node.queue_free()
	enemies.erase(enemy_data)

	if award_reward:
		wave_defeated += 1
		coins += enemy_data.reward

func _position_enemy(enemy_data: EnemyState) -> void:
	var enemy_node: Control = enemy_data.node
	if not is_instance_valid(enemy_node):
		return

	var grid_position: Vector2 = enemy_data.grid_position
	enemy_node.position = Vector2(
		grid_position.x * TILE_SIZE.x - enemy_data.pivot.x,
		grid_position.y * TILE_SIZE.y - enemy_data.pivot.y
	)

func _get_path_point(path_index: int) -> Vector2:
	var tile_position: Vector2i = path_tiles[path_index]
	return Vector2(float(tile_position.x) + 0.5, float(tile_position.y) + 0.5)

func _build_board() -> void:
	for child_index in range(_board.get_child_count()):
		var child: Node = _board.get_child(child_index)
		child.queue_free()

	for index in range(COLS * ROWS):
		var x: int = index % COLS
		var y: int = int(index / COLS)
		var tile_position: Vector2i = Vector2i(x, y)
		var tile: TextureRect = _create_tile(tile_position)
		_board.add_child(tile)

func _create_tile(tile_position: Vector2i) -> TextureRect:
	var tile: TextureRect = TextureRect.new()
	tile.name = "Tile_%02d_%02d" % [tile_position.x, tile_position.y]
	tile.custom_minimum_size = TILE_SIZE
	tile.size = TILE_SIZE
	tile.texture = _get_tile_texture(tile_position)
	tile.stretch_mode = TextureRect.STRETCH_KEEP
	tile.mouse_filter = Control.MOUSE_FILTER_STOP
	tile.gui_input.connect(_on_tile_gui_input.bind(tile_position))
	return tile

func _on_tile_gui_input(event: InputEvent, tile_position: Vector2i) -> void:
	var mouse_event: InputEventMouseButton = event as InputEventMouseButton
	if mouse_event == null:
		return
	if not mouse_event.pressed:
		return
	if mouse_event.button_index != MOUSE_BUTTON_LEFT:
		return

	accept_event()
	_try_place_tower(tile_position)

func _get_tile_texture(tile_position: Vector2i) -> Texture2D:
	if path_tiles.has(tile_position):
		return TILE_PATH
	if blocked_tiles.has(tile_position):
		return TILE_BLOCKED

	var detail_index: int = (tile_position.x * 11 + tile_position.y * 17) % 3
	if detail_index == 1:
		return TILE_PARK_B
	if detail_index == 2:
		return TILE_PARK_C
	return TILE_PARK_A

func _get_enemy_texture(tier: int) -> Texture2D:
	if tier == 1:
		return ENEMY_BRUTE_TEXTURE
	if tier == 2:
		return ENEMY_SHIELD_TEXTURE
	return ENEMY_RUNNER_TEXTURE

func _get_enemy_pivot(_tier: int) -> Vector2:
	return ENEMY_PIVOT

func _try_place_tower(tile_position: Vector2i) -> void:
	if game_over or victory_pending:
		_show_status("Partida encerrada.")
		return
	if paused:
		_show_status("Retome o jogo para construir.")
		return
	if _delete_button.button_pressed:
		_show_status("Remocao de torres ainda nao implementada.")
		return

	var tower_key: String = selected_tower
	var tower_cost: int = _get_tower_cost(tower_key)
	if tower_cost <= 0:
		_show_status("Selecione uma torre.")
		return
	if path_tiles.has(tile_position) or blocked_tiles.has(tile_position):
		_show_status("Espaco bloqueado.")
		return
	if occupied_tiles.has(tile_position):
		_show_status("Ja existe uma torre aqui.")
		return
	if coins < tower_cost:
		_show_status("Moedas insuficientes.")
		return

	var tower_range: float = _get_tower_range(tower_key)
	if not _does_tower_reach_path(tile_position, tower_range):
		_show_status("Torre nao alcanca o caminho.")
		return

	_place_tower(tile_position, tower_key, tower_cost, tower_range)

func _place_tower(tile_position: Vector2i, tower_key: String, tower_cost: int, tower_range: float) -> void:
	var tower_texture: Texture2D = _get_tower_texture(tower_key)
	var range_node: TextureRect = _create_range_ring(tile_position, tower_range)
	_range_layer.add_child(range_node)

	var tower_node: TextureRect = TextureRect.new()
	tower_node.name = "Tower_%03d_%s" % [next_tower_id, tower_key]
	tower_node.texture = tower_texture
	tower_node.size = tower_texture.get_size()
	tower_node.stretch_mode = TextureRect.STRETCH_KEEP
	tower_node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_tower_layer.add_child(tower_node)

	var tower_data: TowerState = TowerState.new()
	tower_data.id = next_tower_id
	tower_data.node = tower_node
	tower_data.range_node = range_node
	tower_data.tile_position = tile_position
	tower_data.tower_type = tower_key
	tower_data.cost = tower_cost
	tower_data.range = tower_range
	tower_data.cooldown = 0.0
	tower_data.damage = _get_tower_damage(tower_key)
	tower_data.fire_rate = _get_tower_fire_rate(tower_key)
	tower_data.projectile_speed = _get_tower_projectile_speed(tower_key)
	tower_data.slow_factor = _get_tower_slow_factor(tower_key)
	tower_data.slow_duration = _get_tower_slow_duration(tower_key)
	tower_data.splash = _get_tower_splash(tower_key)
	next_tower_id += 1
	placed_towers.append(tower_data)
	occupied_tiles.append(tile_position)
	coins -= tower_cost
	_position_tower(tower_data)
	_sync_hud()
	_show_status("%s criada por %d moedas." % [_format_tower_name(tower_key), tower_cost])

func _create_range_ring(tile_position: Vector2i, tower_range: float) -> TextureRect:
	var range_node: TextureRect = TextureRect.new()
	range_node.name = "Range_%02d_%02d" % [tile_position.x, tile_position.y]
	range_node.texture = RANGE_RING_TEXTURE
	range_node.size = RANGE_RING_TEXTURE.get_size()
	range_node.stretch_mode = TextureRect.STRETCH_KEEP
	range_node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	range_node.modulate = Color(1.0, 0.95, 0.45, 0.22)

	var diameter_pixels: float = tower_range * 2.0 * TILE_SIZE.x
	var ring_scale: float = diameter_pixels / RANGE_RING_BASE_DIAMETER
	range_node.scale = Vector2(ring_scale, ring_scale)

	var center: Vector2 = Vector2(float(tile_position.x) + 0.5, float(tile_position.y) + 0.5)
	range_node.position = Vector2(
		center.x * TILE_SIZE.x - RANGE_RING_PIVOT.x * ring_scale,
		center.y * TILE_SIZE.y - RANGE_RING_PIVOT.y * ring_scale
	)
	return range_node

func _position_tower(tower_data: TowerState) -> void:
	var tower_node: Control = tower_data.node
	if not is_instance_valid(tower_node):
		return

	var center: Vector2 = Vector2(
		float(tower_data.tile_position.x) + 0.5,
		float(tower_data.tile_position.y) + 0.5
	)
	tower_node.position = Vector2(
		center.x * TILE_SIZE.x - TOWER_PIVOT.x,
		center.y * TILE_SIZE.y - TOWER_PIVOT.y
	)

func _does_tower_reach_path(tile_position: Vector2i, tower_range: float) -> bool:
	var tower_center: Vector2 = Vector2(float(tile_position.x) + 0.5, float(tile_position.y) + 0.5)
	for path_index in range(path_tiles.size()):
		var path_tile: Vector2i = path_tiles[path_index]
		var path_center: Vector2 = Vector2(float(path_tile.x) + 0.5, float(path_tile.y) + 0.5)
		if tower_center.distance_to(path_center) <= tower_range:
			return true
	return false

func _get_tower_cost(tower_key: String) -> int:
	match tower_key:
		"sentinel":
			return 100
		"slow":
			return 75
		"splash":
			return 125
		"flame":
			return 150
		_:
			return 0

func _get_tower_range(tower_key: String) -> float:
	match tower_key:
		"sentinel":
			return 2.75
		"slow":
			return 2.35
		"splash":
			return 2.45
		"flame":
			return 1.85
		_:
			return 0.0

func _get_tower_texture(tower_key: String) -> Texture2D:
	match tower_key:
		"slow":
			return TOWER_SLOW_TEXTURE
		"splash":
			return TOWER_SPLASH_TEXTURE
		"flame":
			return TOWER_FLAME_TEXTURE
		_:
			return TOWER_SENTINEL_TEXTURE

func _get_tower_damage(tower_key: String) -> int:
	match tower_key:
		"slow":
			return 7
		"splash":
			return 24
		"flame":
			return 9
		_:
			return 18

func _get_tower_fire_rate(tower_key: String) -> float:
	match tower_key:
		"slow":
			return 0.8
		"splash":
			return 0.55
		"flame":
			return 2.8
		_:
			return 1.0

func _get_tower_projectile_speed(tower_key: String) -> float:
	match tower_key:
		"slow":
			return 6.6
		"splash":
			return 6.0
		"flame":
			return 8.5
		_:
			return 7.5

func _get_tower_slow_factor(tower_key: String) -> float:
	if tower_key == "slow":
		return 0.45
	return 1.0

func _get_tower_slow_duration(tower_key: String) -> float:
	if tower_key == "slow":
		return 1.8
	return 0.0

func _get_tower_splash(tower_key: String) -> float:
	if tower_key == "splash":
		return 0.82
	return 0.0

func _update_towers(dt: float) -> void:
	for tower_data in placed_towers:
		tower_data.cooldown = maxf(0.0, tower_data.cooldown - dt)
		if tower_data.cooldown > 0.0:
			continue
		if tower_data.fire_rate <= 0.0:
			continue

		var target: EnemyState = _find_tower_target(tower_data)
		if target == null:
			continue

		tower_data.cooldown = 1.0 / tower_data.fire_rate
		_fire_projectile(tower_data, target)

func _find_tower_target(tower_data: TowerState) -> EnemyState:
	var best_target: EnemyState = null
	var best_progress: float = -1.0
	var tower_center: Vector2 = _get_tower_center(tower_data)

	for enemy_data in enemies:
		var distance: float = tower_center.distance_to(enemy_data.grid_position)
		if distance > tower_data.range:
			continue

		var progress: float = float(enemy_data.path_index) + distance / 10.0
		if progress > best_progress:
			best_target = enemy_data
			best_progress = progress

	return best_target

func _fire_projectile(tower_data: TowerState, target: EnemyState) -> void:
	var projectile_texture: Texture2D = _get_projectile_texture(tower_data.tower_type)
	var projectile_node: TextureRect = TextureRect.new()
	projectile_node.name = "Projectile_%03d" % next_projectile_id
	projectile_node.texture = projectile_texture
	projectile_node.size = projectile_texture.get_size()
	projectile_node.stretch_mode = TextureRect.STRETCH_KEEP
	projectile_node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_projectile_layer.add_child(projectile_node)

	var projectile_data: ProjectileState = ProjectileState.new()
	projectile_data.id = next_projectile_id
	projectile_data.node = projectile_node
	projectile_data.source_tower_id = tower_data.id
	projectile_data.target_id = target.id
	projectile_data.grid_position = _get_tower_center(tower_data) + Vector2(0.0, -0.15)
	projectile_data.damage = tower_data.damage
	projectile_data.speed = tower_data.projectile_speed
	projectile_data.slow_factor = tower_data.slow_factor
	projectile_data.slow_duration = tower_data.slow_duration
	projectile_data.splash = tower_data.splash
	projectile_data.pivot = _get_projectile_pivot(tower_data.tower_type)
	next_projectile_id += 1
	projectiles.append(projectile_data)
	_position_projectile(projectile_data)

func _update_projectiles(dt: float) -> void:
	var finished_projectiles: Array[ProjectileState] = []
	for projectile_data in projectiles:
		var target: EnemyState = _get_enemy_by_id(projectile_data.target_id)
		if target == null:
			finished_projectiles.append(projectile_data)
			continue

		var distance: float = projectile_data.grid_position.distance_to(target.grid_position)
		var travel: float = projectile_data.speed * dt
		if distance <= travel:
			projectile_data.grid_position = target.grid_position
			_position_projectile(projectile_data)
			_hit_enemy(projectile_data, target)
			finished_projectiles.append(projectile_data)
		else:
			projectile_data.grid_position = projectile_data.grid_position.move_toward(target.grid_position, travel)
			_position_projectile(projectile_data)

	for finished_projectile_data in finished_projectiles:
		_remove_projectile(finished_projectile_data)

func _hit_enemy(projectile_data: ProjectileState, target: EnemyState) -> void:
	if projectile_data.splash > 0.0:
		_create_impact(projectile_data.grid_position)
		var splash_targets: Array[EnemyState] = []
		for enemy_data in enemies:
			splash_targets.append(enemy_data)

		for splash_target in splash_targets:
			var distance: float = splash_target.grid_position.distance_to(projectile_data.grid_position)
			if distance > projectile_data.splash:
				continue

			var splash_ratio: float = 1.0 - distance / (projectile_data.splash * 1.55)
			var splash_damage: int = int(round(float(projectile_data.damage) * splash_ratio))
			_damage_enemy(splash_target, maxi(1, splash_damage))
	else:
		_damage_enemy(target, projectile_data.damage)

	if projectile_data.slow_factor < 1.0 and enemies.has(target):
		target.slow_factor = projectile_data.slow_factor
		target.slow_until = maxf(target.slow_until, sim_time + projectile_data.slow_duration)

func _damage_enemy(enemy_data: EnemyState, amount: int) -> void:
	if not enemies.has(enemy_data):
		return

	enemy_data.hp -= maxi(1, amount)
	if enemy_data.hp <= 0:
		_remove_enemy(enemy_data, true)

func _get_enemy_by_id(enemy_id: int) -> EnemyState:
	for enemy_data in enemies:
		if enemy_data.id == enemy_id:
			return enemy_data
	return null

func _get_tower_center(tower_data: TowerState) -> Vector2:
	return Vector2(float(tower_data.tile_position.x) + 0.5, float(tower_data.tile_position.y) + 0.5)

func _get_projectile_texture(tower_key: String) -> Texture2D:
	match tower_key:
		"slow":
			return PROJECTILE_SLOW_TEXTURE
		"splash":
			return PROJECTILE_SPLASH_TEXTURE
		"flame":
			return PROJECTILE_FLAME_TEXTURE
		_:
			return PROJECTILE_DEFAULT_TEXTURE

func _get_projectile_pivot(tower_key: String) -> Vector2:
	if tower_key == "splash":
		return PROJECTILE_SPLASH_PIVOT
	return PROJECTILE_PIVOT

func _position_projectile(projectile_data: ProjectileState) -> void:
	var projectile_node: Control = projectile_data.node
	if not is_instance_valid(projectile_node):
		return

	projectile_node.position = Vector2(
		projectile_data.grid_position.x * TILE_SIZE.x - projectile_data.pivot.x,
		projectile_data.grid_position.y * TILE_SIZE.y - projectile_data.pivot.y
	)

func _remove_projectile(projectile_data: ProjectileState) -> void:
	var projectile_node: Node = projectile_data.node
	if is_instance_valid(projectile_node):
		projectile_node.queue_free()
	projectiles.erase(projectile_data)

func _create_impact(grid_position: Vector2) -> void:
	var impact_node: TextureRect = TextureRect.new()
	impact_node.name = "Impact"
	impact_node.texture = IMPACT_TEXTURE
	impact_node.size = IMPACT_TEXTURE.get_size()
	impact_node.stretch_mode = TextureRect.STRETCH_KEEP
	impact_node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_effect_layer.add_child(impact_node)

	var impact_data: ImpactState = ImpactState.new()
	impact_data.node = impact_node
	impact_data.grid_position = grid_position
	impact_data.life = 0.22
	impact_data.pivot = IMPACT_PIVOT
	impacts.append(impact_data)
	_position_impact(impact_data)

func _update_impacts(dt: float) -> void:
	var finished_impacts: Array[ImpactState] = []
	for impact_data in impacts:
		impact_data.life -= dt
		if impact_data.life <= 0.0:
			finished_impacts.append(impact_data)
			continue

		var alpha: float = maxf(0.0, minf(1.0, impact_data.life / 0.22))
		impact_data.node.modulate = Color(1.0, 1.0, 1.0, alpha)

	for finished_impact_data in finished_impacts:
		_remove_impact(finished_impact_data)

func _position_impact(impact_data: ImpactState) -> void:
	var impact_node: Control = impact_data.node
	if not is_instance_valid(impact_node):
		return

	impact_node.position = Vector2(
		impact_data.grid_position.x * TILE_SIZE.x - impact_data.pivot.x,
		impact_data.grid_position.y * TILE_SIZE.y - impact_data.pivot.y
	)

func _remove_impact(impact_data: ImpactState) -> void:
	var impact_node: Node = impact_data.node
	if is_instance_valid(impact_node):
		impact_node.queue_free()
	impacts.erase(impact_data)

func _apply_tower_button_icons() -> void:
	_configure_tower_button_icon(_tower_buttons["sentinel"] as Button, TOWER_SENTINEL_TEXTURE)
	_configure_tower_button_icon(_tower_buttons["slow"] as Button, TOWER_SLOW_TEXTURE)
	_configure_tower_button_icon(_tower_buttons["splash"] as Button, TOWER_SPLASH_TEXTURE)
	_configure_tower_button_icon(_tower_buttons["flame"] as Button, TOWER_FLAME_TEXTURE)

func _configure_tower_button_icon(button: Button, texture: Texture2D) -> void:
	if button == null:
		return

	button.icon = texture
	button.expand_icon = false
	button.icon_alignment = HORIZONTAL_ALIGNMENT_LEFT
	button.vertical_icon_alignment = VERTICAL_ALIGNMENT_CENTER

func _connect_buttons() -> void:
	_delete_button.toggle_mode = true
	_pause_button.toggle_mode = true
	_speed_button.toggle_mode = true

	_restart_button.pressed.connect(_start_run)
	_menu_button.pressed.connect(_return_to_menu)
	_delete_button.pressed.connect(_toggle_delete_mode)
	_pause_button.pressed.connect(_toggle_pause)
	_speed_button.pressed.connect(_toggle_speed)
	_floating_message_timer.timeout.connect(_hide_floating_message)
	_wave_banner_timer.timeout.connect(_hide_wave_banner)

	for tower_key in _tower_buttons:
		var tower_key_string: String = str(tower_key)
		var button: Button = _tower_buttons[tower_key_string] as Button
		button.toggle_mode = true
		button.pressed.connect(_select_tower.bind(tower_key_string))

func _sync_session_labels() -> void:
	_difficulty_value.text = _format_difficulty(GameSession.difficulty)
	_waves_value.text = str(wave_limit)
	_cards_value.text = _format_card_frequency(GameSession.card_frequency)

func _sync_hud() -> void:
	_lives_label.text = "Vidas %d" % lives
	_wave_label.text = "Onda %d/%d" % [wave, wave_limit]
	_defeated_label.text = "Derrotou %d" % session_defeated
	_time_label.text = "Tempo " + _format_session_time(session_time)
	_money_label.text = "Moedas %d" % coins

func _select_tower(tower_key: String) -> void:
	selected_tower = tower_key
	for key in _tower_buttons:
		var tower_key_string: String = str(key)
		var button: Button = _tower_buttons[tower_key_string] as Button
		button.button_pressed = tower_key_string == selected_tower
	_show_status("Torre selecionada: " + _format_tower_name(selected_tower))

func _toggle_delete_mode() -> void:
	var text: String = "Modo excluir ligado." if _delete_button.button_pressed else "Modo excluir desligado."
	_show_status(text)

func _toggle_pause() -> void:
	paused = _pause_button.button_pressed
	_pause_button.text = "Retomar" if paused else "Pause"
	_show_status("Jogo pausado." if paused else "Jogo retomado.")

func _toggle_speed() -> void:
	speed_multiplier = 2.0 if _speed_button.button_pressed else 1.0
	_speed_button.text = "2x" if _speed_button.button_pressed else "1x"
	_show_status("Velocidade 2x." if _speed_button.button_pressed else "Velocidade 1x.")

func _show_status(text: String) -> void:
	_status_label.text = text
	_floating_message_label.text = text
	_floating_message.show()
	_floating_message_timer.start()

func _hide_floating_message() -> void:
	_floating_message.hide()

func _show_wave_banner(text: String) -> void:
	_wave_banner_label.text = text
	_wave_banner.show()
	_wave_banner_timer.start()

func _hide_wave_banner() -> void:
	_wave_banner.hide()

func _clear_enemies() -> void:
	for enemy_data in enemies:
		var enemy_node: Node = enemy_data.node
		if is_instance_valid(enemy_node):
			enemy_node.queue_free()
	enemies.clear()
	for child_index in range(_enemy_layer.get_child_count()):
		var child: Node = _enemy_layer.get_child(child_index)
		child.queue_free()

func _clear_towers() -> void:
	for tower_data in placed_towers:
		var tower_node: Node = tower_data.node
		if is_instance_valid(tower_node):
			tower_node.queue_free()
		var range_node: Node = tower_data.range_node
		if is_instance_valid(range_node):
			range_node.queue_free()
	placed_towers.clear()
	occupied_tiles.clear()
	next_tower_id = 1
	for child_index in range(_tower_layer.get_child_count()):
		var child: Node = _tower_layer.get_child(child_index)
		child.queue_free()
	for range_child_index in range(_range_layer.get_child_count()):
		var range_child: Node = _range_layer.get_child(range_child_index)
		range_child.queue_free()

func _clear_projectiles() -> void:
	for projectile_data in projectiles:
		var projectile_node: Node = projectile_data.node
		if is_instance_valid(projectile_node):
			projectile_node.queue_free()
	projectiles.clear()
	next_projectile_id = 1
	for child_index in range(_projectile_layer.get_child_count()):
		var child: Node = _projectile_layer.get_child(child_index)
		child.queue_free()

func _clear_impacts() -> void:
	for impact_data in impacts:
		var impact_node: Node = impact_data.node
		if is_instance_valid(impact_node):
			impact_node.queue_free()
	impacts.clear()
	for child_index in range(_effect_layer.get_child_count()):
		var child: Node = _effect_layer.get_child(child_index)
		child.queue_free()

func _return_to_menu() -> void:
	var error: int = get_tree().change_scene_to_file(MAIN_MENU_SCENE)
	if error != OK:
		_show_status("Erro ao voltar ao menu.")

func _format_session_time(value: float) -> String:
	var total_seconds: int = int(floor(value))
	var minutes: int = int(total_seconds / 60)
	var seconds: int = total_seconds % 60
	return "%02d:%02d" % [minutes, seconds]

func _format_difficulty(difficulty: String) -> String:
	match difficulty:
		"easy":
			return "Facil"
		"medium":
			return "Medio"
		"hard":
			return "Dificil"
		"custom":
			return "Custom"
		_:
			return "Medio"

func _format_tower_name(tower_key: String) -> String:
	match tower_key:
		"sentinel":
			return "Sentinela"
		"slow":
			return "Lenta"
		"splash":
			return "Splash"
		"flame":
			return "Fogo"
		_:
			return "Sentinela"

func _format_card_frequency(value: int) -> String:
	if value <= 0:
		return "Off"
	if value == 1:
		return "1 onda"
	return "%d ondas" % value
