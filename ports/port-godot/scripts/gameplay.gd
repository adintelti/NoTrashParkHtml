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
const UNDO_PLACEMENT_WINDOW: float = 5.0
const CARD_EFFECT_DURATION_WAVES: int = 1
const CARD_COIN_GAIN: int = 100
const CARD_COIN_LOSS: int = 70
const DAMAGE_BUFF_MULTIPLIER: float = 1.3
const DAMAGE_SETBACK_MULTIPLIER: float = 1.0 / DAMAGE_BUFF_MULTIPLIER
const POWER_SURGE_MULTIPLIER: float = 2.0
const RANGE_BUFF_MULTIPLIER: float = 1.25
const RANGE_SETBACK_MULTIPLIER: float = 1.0 / RANGE_BUFF_MULTIPLIER
const MAX_TOWER_RANGE: float = 7.0
const DAMAGE_MAX_EPSILON: float = 0.001
const RANGE_MAX_EPSILON: float = 0.001
const CARD_BACK_SIZE: Vector2 = Vector2(150, 210)
const CARD_REVEALED_SIZE: Vector2 = Vector2(650, 188)

const TILE_PARK_A: Texture2D = preload("res://assets/tiles/park_terrain_detail_a.png")
const TILE_PARK_B: Texture2D = preload("res://assets/tiles/park_terrain_detail_b.png")
const TILE_PARK_C: Texture2D = preload("res://assets/tiles/park_terrain_detail_c.png")
const TILE_PARK_PATH: Texture2D = preload("res://assets/tiles/park_path.png")
const TILE_PARK_BLOCKED: Texture2D = preload("res://assets/tiles/park_terrain_blocked.png")
const TILE_LAGOON_A: Texture2D = preload("res://assets/tiles/lagoon_terrain_detail_a.png")
const TILE_LAGOON_B: Texture2D = preload("res://assets/tiles/lagoon_terrain_detail_b.png")
const TILE_LAGOON_C: Texture2D = preload("res://assets/tiles/lagoon_terrain_detail_c.png")
const TILE_LAGOON_PATH: Texture2D = preload("res://assets/tiles/lagoon_path.png")
const TILE_LAGOON_BLOCKED: Texture2D = preload("res://assets/tiles/lagoon_terrain_blocked.png")
const TILE_LAVA_A: Texture2D = preload("res://assets/tiles/lava_terrain_detail_a.png")
const TILE_LAVA_B: Texture2D = preload("res://assets/tiles/lava_terrain_detail_b.png")
const TILE_LAVA_C: Texture2D = preload("res://assets/tiles/lava_terrain_detail_c.png")
const TILE_LAVA_PATH: Texture2D = preload("res://assets/tiles/lava_path.png")
const TILE_LAVA_BLOCKED: Texture2D = preload("res://assets/tiles/lava_terrain_blocked.png")

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
const CARD_BACK_TEXTURE: Texture2D = preload("res://assets/ui/ui_card_back.png")

var current_theme: String = "park"
var transition_active: bool = false
var selected_tower: String = "sentinel"
var wave_limit: int = 12
var wave: int = 0
var lives: int = 10
var coins: int = 300
var session_defeated: int = 0
var wave_defeated: int = 0
var wave_hp_lost: int = 0
var spawn_remaining: int = 0
var spawn_timer: float = 0.0
var wave_cooldown: float = INITIAL_WAVE_COOLDOWN
var wave_in_progress: bool = false
var paused: bool = false
var game_over: bool = false
var victory_pending: bool = false
var card_choice_active: bool = false
var card_choice_revealed: bool = false
var card_choice_previous_paused: bool = false
var selected_card_id: String = ""
var card_result_text: String = ""
var session_time: float = 0.0
var sim_time: float = 0.0
var next_enemy_id: int = 1
var next_tower_id: int = 1
var next_projectile_id: int = 1
var next_card_id: int = 1
var speed_multiplier: float = 1.0
var enemies: Array[EnemyState] = []
var placed_towers: Array[TowerState] = []
var projectiles: Array[ProjectileState] = []
var impacts: Array[ImpactState] = []
var card_choices: Array[Dictionary] = []
var tower_buffs: Array[Dictionary] = []
var enemy_modifiers: Array[Dictionary] = []
var occupied_tiles: Array[Vector2i] = []
var last_placed_tower: TowerState = null
var pending_delete_tower: TowerState = null
var delete_confirm_previous_paused: bool = false
var preview_visible: bool = false
var preview_tile_position: Vector2i = Vector2i(-1, -1)
var preview_range_node: TextureRect
var preview_tower_node: TextureRect
var preview_path_overlays: Array[ColorRect] = []

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

@onready var _board_stage: ColorRect = get_node("AppBackground/GameFrame/GameLayout/BoardStage")
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
@onready var _victory_overlay: Control = get_node("AppBackground/GameFrame/GameLayout/BoardStage/VictoryOverlay")
@onready var _victory_title: Label = get_node("AppBackground/GameFrame/GameLayout/BoardStage/VictoryOverlay/VictoryCard/VictoryInset/VictoryContent/VictoryTitle")
@onready var _victory_summary: Label = get_node("AppBackground/GameFrame/GameLayout/BoardStage/VictoryOverlay/VictoryCard/VictoryInset/VictoryContent/VictorySummary")
@onready var _victory_time_value: Label = get_node("AppBackground/GameFrame/GameLayout/BoardStage/VictoryOverlay/VictoryCard/VictoryInset/VictoryContent/VictoryStats/TimeStat/TimeBox/TimeValue")
@onready var _victory_wave_value: Label = get_node("AppBackground/GameFrame/GameLayout/BoardStage/VictoryOverlay/VictoryCard/VictoryInset/VictoryContent/VictoryStats/WaveStat/WaveBox/WaveValue")
@onready var _victory_defeated_value: Label = get_node("AppBackground/GameFrame/GameLayout/BoardStage/VictoryOverlay/VictoryCard/VictoryInset/VictoryContent/VictoryStats/DefeatedStat/DefeatedBox/DefeatedValue")
@onready var _victory_continue_button: Button = get_node("AppBackground/GameFrame/GameLayout/BoardStage/VictoryOverlay/VictoryCard/VictoryInset/VictoryContent/VictoryActions/VictoryContinueButton")
@onready var _victory_restart_button: Button = get_node("AppBackground/GameFrame/GameLayout/BoardStage/VictoryOverlay/VictoryCard/VictoryInset/VictoryContent/VictoryActions/VictoryRestartButton")
@onready var _victory_menu_button: Button = get_node("AppBackground/GameFrame/GameLayout/BoardStage/VictoryOverlay/VictoryCard/VictoryInset/VictoryContent/VictoryActions/VictoryMenuButton")
@onready var _victory_time_label: Label = get_node("AppBackground/GameFrame/GameLayout/BoardStage/VictoryOverlay/VictoryCard/VictoryInset/VictoryContent/VictoryStats/TimeStat/TimeBox/TimeLabel")
@onready var _victory_wave_label: Label = get_node("AppBackground/GameFrame/GameLayout/BoardStage/VictoryOverlay/VictoryCard/VictoryInset/VictoryContent/VictoryStats/WaveStat/WaveBox/WaveLabel")
@onready var _victory_defeated_label: Label = get_node("AppBackground/GameFrame/GameLayout/BoardStage/VictoryOverlay/VictoryCard/VictoryInset/VictoryContent/VictoryStats/DefeatedStat/DefeatedBox/DefeatedLabel")
@onready var _tower_delete_confirm_overlay: Control = get_node("AppBackground/GameFrame/GameLayout/BoardStage/TowerDeleteConfirmOverlay")
@onready var _tower_delete_confirm_title: Label = get_node("AppBackground/GameFrame/GameLayout/BoardStage/TowerDeleteConfirmOverlay/TowerDeleteCard/TowerDeleteInset/TowerDeleteContent/TowerDeleteTitle")
@onready var _tower_delete_confirm_summary: Label = get_node("AppBackground/GameFrame/GameLayout/BoardStage/TowerDeleteConfirmOverlay/TowerDeleteCard/TowerDeleteInset/TowerDeleteContent/TowerDeleteSummary")
@onready var _tower_delete_confirm_remove_button: Button = get_node("AppBackground/GameFrame/GameLayout/BoardStage/TowerDeleteConfirmOverlay/TowerDeleteCard/TowerDeleteInset/TowerDeleteContent/TowerDeleteActions/TowerDeleteRemoveButton")
@onready var _tower_delete_confirm_cancel_button: Button = get_node("AppBackground/GameFrame/GameLayout/BoardStage/TowerDeleteConfirmOverlay/TowerDeleteCard/TowerDeleteInset/TowerDeleteContent/TowerDeleteActions/TowerDeleteCancelButton")
@onready var _card_choice_overlay: Control = get_node("AppBackground/GameFrame/GameLayout/BoardStage/CardChoiceOverlay")
@onready var _card_choice_kicker: Label = get_node("AppBackground/GameFrame/GameLayout/BoardStage/CardChoiceOverlay/CardChoicePanel/CardChoiceInset/CardChoiceContent/CardChoiceKicker")
@onready var _card_choice_title: Label = get_node("AppBackground/GameFrame/GameLayout/BoardStage/CardChoiceOverlay/CardChoicePanel/CardChoiceInset/CardChoiceContent/CardChoiceTitle")
@onready var _card_choice_result: PanelContainer = get_node("AppBackground/GameFrame/GameLayout/BoardStage/CardChoiceOverlay/CardChoicePanel/CardChoiceInset/CardChoiceContent/CardChoiceResult")
@onready var _card_choice_result_label: Label = get_node("AppBackground/GameFrame/GameLayout/BoardStage/CardChoiceOverlay/CardChoicePanel/CardChoiceInset/CardChoiceContent/CardChoiceResult/CardChoiceResultLabel")
@onready var _card_choice_continue_button: Button = get_node("AppBackground/GameFrame/GameLayout/BoardStage/CardChoiceOverlay/CardChoicePanel/CardChoiceInset/CardChoiceContent/CardChoiceContinueButton")
@onready var _card_choice_buttons: Array[Button] = [
	get_node("AppBackground/GameFrame/GameLayout/BoardStage/CardChoiceOverlay/CardChoicePanel/CardChoiceInset/CardChoiceContent/CardChoiceCards/CardChoiceButton1") as Button,
	get_node("AppBackground/GameFrame/GameLayout/BoardStage/CardChoiceOverlay/CardChoicePanel/CardChoiceInset/CardChoiceContent/CardChoiceCards/CardChoiceButton2") as Button,
	get_node("AppBackground/GameFrame/GameLayout/BoardStage/CardChoiceOverlay/CardChoicePanel/CardChoiceInset/CardChoiceContent/CardChoiceCards/CardChoiceButton3") as Button,
	get_node("AppBackground/GameFrame/GameLayout/BoardStage/CardChoiceOverlay/CardChoicePanel/CardChoiceInset/CardChoiceContent/CardChoiceCards/CardChoiceButton4") as Button
]
@onready var _theme_transition_overlay: Control = get_node("AppBackground/GameFrame/GameLayout/ThemeTransitionOverlay")
@onready var _theme_transition_dimmer: ColorRect = get_node("AppBackground/GameFrame/GameLayout/ThemeTransitionOverlay/ThemeTransitionDimmer")
@onready var _theme_transition_label: Label = get_node("AppBackground/GameFrame/GameLayout/ThemeTransitionOverlay/ThemeTransitionLabel")
@onready var _floating_message_timer: Timer = get_node("FloatingMessageTimer")
@onready var _wave_banner_timer: Timer = get_node("WaveBannerTimer")
@onready var _undo_placement_timer: Timer = get_node("UndoPlacementTimer")
@onready var _difficulty_label: Label = get_node("AppBackground/GameFrame/GameLayout/ShopPanel/ShopContent/SessionInfo/SessionRows/DifficultyLabel")
@onready var _difficulty_value: Label = get_node("AppBackground/GameFrame/GameLayout/ShopPanel/ShopContent/SessionInfo/SessionRows/DifficultyValue")
@onready var _waves_label: Label = get_node("AppBackground/GameFrame/GameLayout/ShopPanel/ShopContent/SessionInfo/SessionRows/WavesLabel")
@onready var _waves_value: Label = get_node("AppBackground/GameFrame/GameLayout/ShopPanel/ShopContent/SessionInfo/SessionRows/WavesValue")
@onready var _cards_label: Label = get_node("AppBackground/GameFrame/GameLayout/ShopPanel/ShopContent/SessionInfo/SessionRows/CardsLabel")
@onready var _cards_value: Label = get_node("AppBackground/GameFrame/GameLayout/ShopPanel/ShopContent/SessionInfo/SessionRows/CardsValue")
@onready var _status_label: Label = get_node("AppBackground/GameFrame/GameLayout/ShopPanel/ShopContent/StatusLabel")
@onready var _money_label: Label = get_node("AppBackground/GameFrame/GameLayout/ShopPanel/ShopContent/ShopTop/MoneyPanel/MoneyContent/MoneyLabel")
@onready var _restart_button: Button = get_node("AppBackground/GameFrame/GameLayout/ShopPanel/ShopContent/ShopTop/ShopActions/RestartButton")
@onready var _menu_button: Button = get_node("AppBackground/GameFrame/GameLayout/ShopPanel/ShopContent/ShopTop/ShopActions/MenuButton")
@onready var _undo_button: Button = get_node("AppBackground/GameFrame/GameLayout/ShopPanel/ShopContent/ToolsGrid/UndoButton")
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
	randomize()
	GameSession.apply_language(GameSession.language, false)
	_floating_message.hide()
	_wave_banner.hide()
	_victory_overlay.hide()
	_tower_delete_confirm_overlay.hide()
	_card_choice_overlay.hide()
	_theme_transition_overlay.hide()
	_theme_transition_dimmer.color = Color(0.015686275, 0.05490196, 0.078431375, 0.92)
	_theme_transition_overlay.modulate = Color(1.0, 1.0, 1.0, 0.0)
	_connect_buttons()
	_apply_static_translations()
	_start_run()
	_ensure_placement_preview_nodes()

func _process(delta: float) -> void:
	if transition_active:
		return
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
	_hide_victory_overlay()
	_hide_tower_delete_confirm_overlay()
	_hide_card_choice_overlay()
	_clear_undo_placement()
	_hide_placement_preview()
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
	wave_hp_lost = 0
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
	next_card_id = 1
	speed_multiplier = 1.0
	card_choices.clear()
	tower_buffs.clear()
	enemy_modifiers.clear()
	card_choice_active = false
	card_choice_revealed = false
	card_choice_previous_paused = false
	selected_card_id = ""
	card_result_text = ""
	_load_theme(GameSession.theme)
	_set_pause_state(false)
	_speed_button.set_pressed_no_signal(false)
	_speed_button.text = "1x"
	_set_delete_mode(false, "", false)
	_sync_session_labels()
	_sync_hud()
	_show_status(GameSession.t("messages.prepareWave", {"wave": 1}))

func _update_wave_flow(dt: float) -> void:
	if card_choice_active:
		return
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
	wave_hp_lost = 0
	spawn_remaining = 6 + wave * 2
	spawn_timer = 0.0
	wave_in_progress = true
	_show_wave_banner(GameSession.t("hud.wave") + " %d" % wave)
	_show_status(GameSession.t("messages.waveStarted", {"wave": wave}))

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
	var finished_wave: int = wave
	wave_in_progress = false
	session_defeated += wave_defeated
	wave_defeated = 0
	_show_wave_banner(GameSession.t("messages.waveCompleted", {"wave": finished_wave}))
	_clear_expired_card_effects(finished_wave)

	if finished_wave >= wave_limit:
		_finish_victory()
		return

	if _should_offer_card_choice(finished_wave):
		_start_card_choice()
		return

	_start_between_wave_cooldown(finished_wave)

func _start_between_wave_cooldown(finished_wave: int) -> void:
	wave_cooldown = BETWEEN_WAVE_COOLDOWN
	_show_status(GameSession.t("messages.nextWaveSoon", {"wave": finished_wave}))

func _finish_victory() -> void:
	victory_pending = true
	wave_in_progress = false
	spawn_remaining = 0
	_set_delete_mode(false, "", false)
	_hide_tower_delete_confirm_overlay()
	_clear_undo_placement()
	_hide_placement_preview()
	_clear_enemies()
	_clear_projectiles()
	_clear_impacts()
	_show_status(GameSession.t("messages.allWavesDone"))
	_sync_hud()
	_show_victory_overlay()

func _end_game() -> void:
	game_over = true
	wave_in_progress = false
	spawn_remaining = 0
	_set_delete_mode(false, "", false)
	_hide_tower_delete_confirm_overlay()
	_clear_undo_placement()
	_hide_placement_preview()
	_clear_enemies()
	_clear_projectiles()
	_clear_impacts()
	_show_wave_banner(GameSession.t("victory.gameOver"))
	_show_status(GameSession.t("messages.themeLostLives", {"theme": GameSession.get_theme_name(current_theme)}))
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
	return base_speed * (1.0 + minf(float(wave), 8.0) * 0.025) * _get_enemy_modifier_multiplier("speed")

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
	return int(round(float(base_hp) * (1.0 + float(wave) * 0.12) * _get_enemy_modifier_multiplier("hp")))

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
		wave_hp_lost += 1
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
		AudioManager.play_sfx("enemyDeath")

func _position_enemy(enemy_data: EnemyState) -> void:
	var enemy_node: Control = enemy_data.node
	if not is_instance_valid(enemy_node):
		return

	var grid_position: Vector2 = enemy_data.grid_position
	enemy_node.position = Vector2(
		grid_position.x * TILE_SIZE.x - enemy_data.pivot.x,
		grid_position.y * TILE_SIZE.y - enemy_data.pivot.y
	)

func _should_offer_card_choice(finished_wave: int) -> bool:
	var offer_interval: int = GameSession.card_frequency
	return finished_wave < wave_limit and offer_interval > 0 and wave_hp_lost <= 0 and finished_wave % offer_interval == 0

func _start_card_choice() -> void:
	card_choice_previous_paused = paused
	_set_delete_mode(false, "", false)
	_hide_tower_delete_confirm_overlay()
	_clear_undo_placement()
	_hide_placement_preview()
	card_choice_active = true
	card_choice_revealed = false
	selected_card_id = ""
	card_result_text = ""
	card_choices = _create_card_choices()
	_set_pause_state(true)
	_sync_tower_shop_buttons()
	_show_card_choice_overlay()
	_sync_hud()
	_show_status(GameSession.t("cards.kicker"))

func _select_card_choice_index(card_index: int) -> void:
	if not card_choice_active or card_choice_revealed:
		return
	if card_index < 0 or card_index >= card_choices.size():
		return

	var card: Dictionary = card_choices[card_index]
	selected_card_id = String(card.get("id", ""))
	card_choice_revealed = true
	card_result_text = _apply_card_effect(card)
	_render_card_choice_overlay()
	_sync_tower_shop_buttons()
	_sync_hud()
	_card_choice_continue_button.call_deferred("grab_focus")

func _continue_card_choice() -> void:
	if not card_choice_active or not card_choice_revealed:
		return

	var restore_paused: bool = card_choice_previous_paused
	_reset_card_choice_state()
	_hide_card_choice_overlay()
	_set_pause_state(restore_paused)
	_sync_tower_shop_buttons()
	_start_between_wave_cooldown(wave)
	_sync_hud()

func _reset_card_choice_state() -> void:
	card_choice_active = false
	card_choice_revealed = false
	card_choice_previous_paused = false
	selected_card_id = ""
	card_result_text = ""
	card_choices.clear()

func _show_card_choice_overlay() -> void:
	_render_card_choice_overlay()
	_card_choice_overlay.show()
	_card_choice_overlay.move_to_front()
	if not _card_choice_buttons.is_empty():
		_card_choice_buttons[0].call_deferred("grab_focus")

func _hide_card_choice_overlay() -> void:
	_card_choice_overlay.hide()
	_card_choice_result.hide()
	_card_choice_continue_button.hide()
	for button in _card_choice_buttons:
		button.hide()

func _render_card_choice_overlay() -> void:
	_card_choice_kicker.text = GameSession.t("cards.kicker")
	_card_choice_title.text = GameSession.t("cards.choose")
	_card_choice_result.visible = card_choice_revealed and not card_result_text.is_empty()
	_card_choice_result_label.text = card_result_text
	_card_choice_continue_button.visible = card_choice_revealed
	_card_choice_continue_button.text = GameSession.t("common.continue")

	for index in range(_card_choice_buttons.size()):
		var button: Button = _card_choice_buttons[index]
		if index >= card_choices.size():
			button.hide()
			continue

		var card: Dictionary = card_choices[index]
		var card_id: String = String(card.get("id", ""))
		var is_selected: bool = card_choice_revealed and card_id == selected_card_id
		button.show()
		button.icon = null
		button.expand_icon = false
		button.alignment = HORIZONTAL_ALIGNMENT_CENTER
		button.add_theme_color_override("font_color", Color(0.08235294, 0.16470589, 0.20784314, 1.0))

		if card_choice_revealed and not is_selected:
			button.hide()
			continue

		if is_selected:
			var card_kind: String = String(card.get("kind", "neutral"))
			var front_text_color: Color = Color(0.08627451, 0.043137256, 0.0, 1.0)
			if card_kind == "bane":
				front_text_color = Color(1.0, 0.9411765, 0.84705883, 1.0)
			button.custom_minimum_size = CARD_REVEALED_SIZE
			button.disabled = true
			button.add_theme_font_size_override("font_size", 22)
			button.add_theme_color_override("font_color", front_text_color)
			button.add_theme_color_override("font_disabled_color", front_text_color)
			button.add_theme_stylebox_override("normal", _make_card_front_style(card_kind))
			button.add_theme_stylebox_override("pressed", _make_card_front_style(card_kind))
			button.add_theme_stylebox_override("hover", _make_card_front_style(card_kind))
			button.add_theme_stylebox_override("disabled", _make_card_front_style(card_kind))
			button.text = "%s\n%s\n%s" % [
				GameSession.t("cards.kind.%s" % card_kind),
				_wrap_card_text(String(card.get("title", "")), 30),
				_wrap_card_text(String(card.get("description", "")), 42)
			]
		else:
			button.custom_minimum_size = CARD_BACK_SIZE
			button.disabled = false
			button.add_theme_font_size_override("font_size", 26)
			button.add_theme_stylebox_override("normal", _make_card_back_style())
			button.add_theme_stylebox_override("pressed", _make_card_back_style())
			button.add_theme_stylebox_override("hover", _make_card_back_style())
			button.add_theme_stylebox_override("disabled", _make_card_back_style())
			button.text = "?\n%s" % GameSession.t("cards.cardIndex", {"index": index + 1})

func _wrap_card_text(text: String, max_line_length: int) -> String:
	var words: PackedStringArray = text.split(" ", false)
	var lines: Array[String] = []
	var current_line: String = ""
	for word_index in range(words.size()):
		var word: String = words[word_index]
		if current_line.is_empty():
			current_line = word
		elif current_line.length() + 1 + word.length() <= max_line_length:
			current_line += " " + word
		else:
			lines.append(current_line)
			current_line = word

	if not current_line.is_empty():
		lines.append(current_line)

	var wrapped_text: String = ""
	for line_index in range(lines.size()):
		if line_index > 0:
			wrapped_text += "\n"
		wrapped_text += lines[line_index]
	return wrapped_text

func _make_card_back_style() -> StyleBoxTexture:
	var style: StyleBoxTexture = StyleBoxTexture.new()
	style.texture = CARD_BACK_TEXTURE
	style.texture_margin_left = 8.0
	style.texture_margin_top = 8.0
	style.texture_margin_right = 8.0
	style.texture_margin_bottom = 8.0
	return style

func _make_card_front_style(card_kind: String) -> StyleBoxFlat:
	var style: StyleBoxFlat = StyleBoxFlat.new()
	match card_kind:
		"boon":
			style.bg_color = Color(0.62352943, 0.8901961, 0.43529412, 1.0)
		"bane":
			style.bg_color = Color(0.6509804, 0.23529412, 0.19607843, 1.0)
		_:
			style.bg_color = Color(0.9529412, 0.9411765, 0.8235294, 1.0)
	style.border_width_left = 5
	style.border_width_top = 5
	style.border_width_right = 5
	style.border_width_bottom = 5
	style.border_color = Color(0.07058824, 0.043137256, 0.02745098, 1.0)
	style.corner_radius_top_left = 4
	style.corner_radius_top_right = 4
	style.corner_radius_bottom_right = 4
	style.corner_radius_bottom_left = 4
	style.shadow_color = Color(0, 0, 0, 0.2)
	style.shadow_size = 4
	return style

func _create_card_choices() -> Array[Dictionary]:
	var tower_type_clear_card: Dictionary = _create_tower_type_clear_card_config()
	if not tower_type_clear_card.is_empty():
		var power_surge_card: Dictionary = _create_power_surge_card_config()
		var boon_count: int = 1 if not power_surge_card.is_empty() else 2
		var filled_cards: Array[Dictionary] = []
		filled_cards.append(_create_neutral_card())
		filled_cards.append_array(_create_boon_cards(boon_count))
		filled_cards.append(_build_card("bane", tower_type_clear_card))
		if not power_surge_card.is_empty():
			filled_cards.append(_build_card("boon", power_surge_card))
		return _shuffle_cards(filled_cards)

	var cards: Array[Dictionary] = []
	cards.append(_create_neutral_card())
	cards.append_array(_create_boon_cards(2))
	cards.append(_create_bane_card())
	return _shuffle_cards(cards)

func _create_neutral_card() -> Dictionary:
	var effect: Dictionary = {"type": "none"}
	var config: Dictionary = {
		"title": GameSession.t("cards.neutral.title"),
		"description": GameSession.t("cards.neutral.description"),
		"result": GameSession.t("cards.neutral.result"),
		"effect": effect
	}
	return _build_card("neutral", config)

func _create_boon_cards(count: int) -> Array[Dictionary]:
	var configs: Array[Dictionary] = _shuffle_cards(_create_boon_card_configs())
	var cards: Array[Dictionary] = []
	var limit: int = mini(count, configs.size())
	for index in range(limit):
		cards.append(_build_card("boon", configs[index]))
	return cards

func _create_boon_card_configs() -> Array[Dictionary]:
	var configs: Array[Dictionary] = []
	var damage_tower_key: String = _get_random_damage_buff_tower_key()
	var range_tower_key: String = _get_random_range_buff_tower_key()

	if not damage_tower_key.is_empty():
		configs.append(_create_damage_buff_card_config(damage_tower_key))
	if not range_tower_key.is_empty():
		configs.append(_create_range_buff_card_config(range_tower_key))

	configs.append({
		"title": GameSession.t("cards.coinsGain.title"),
		"description": GameSession.t("cards.coinsGain.description", {"amount": CARD_COIN_GAIN}),
		"result": GameSession.t("cards.coinsGain.result", {"amount": CARD_COIN_GAIN}),
		"effect": {"type": "coins", "amount": CARD_COIN_GAIN}
	})

	if lives < 10:
		configs.append({
			"title": GameSession.t("cards.heal.title"),
			"description": GameSession.t("cards.heal.description"),
			"result": GameSession.t("cards.heal.result"),
			"effect": {"type": "heal", "amount": 1}
		})

	return configs

func _create_damage_buff_card_config(tower_key: String) -> Dictionary:
	var tower_label: String = _format_tower_name(tower_key)
	var max_damage: int = _get_tower_max_damage(tower_key)
	return {
		"title": GameSession.t("cards.damage.title", {"tower": tower_label}),
		"description": GameSession.t("cards.damage.description", {"tower": tower_label, "max": max_damage}),
		"result": GameSession.t("cards.damage.result", {"tower": tower_label, "max": max_damage}),
		"effect": {
			"type": "towerBuff",
			"tower_type": tower_key,
			"stat": "damage",
			"multiplier": DAMAGE_BUFF_MULTIPLIER,
			"permanent": true
		}
	}

func _create_range_buff_card_config(tower_key: String) -> Dictionary:
	var tower_label: String = _format_tower_name(tower_key)
	return {
		"title": GameSession.t("cards.range.title", {"tower": tower_label}),
		"description": GameSession.t("cards.range.description", {"tower": tower_label}),
		"result": GameSession.t("cards.range.result", {"tower": tower_label}),
		"effect": {
			"type": "towerBuff",
			"tower_type": tower_key,
			"stat": "range",
			"multiplier": RANGE_BUFF_MULTIPLIER,
			"permanent": true
		}
	}

func _create_power_surge_card_config() -> Dictionary:
	var tower_data: TowerState = _get_random_placed_tower()
	if tower_data == null:
		return {}

	var tower_label: String = _format_tower_name(tower_data.tower_type)
	return {
		"title": GameSession.t("cards.powerSurge.title", {"tower": tower_label}),
		"description": GameSession.t("cards.powerSurge.description", {"tower": tower_label}),
		"result": GameSession.t("cards.powerSurge.result", {"tower": tower_label}),
		"effect": {
			"type": "towerBuff",
			"tower_id": tower_data.id,
			"tower_type": tower_data.tower_type,
			"stat": "damage",
			"multiplier": POWER_SURGE_MULTIPLIER,
			"duration_waves": CARD_EFFECT_DURATION_WAVES,
			"ignore_max_damage": true
		}
	}

func _create_bane_card() -> Dictionary:
	var tower_type_clear_card: Dictionary = _create_tower_type_clear_card_config()
	if not tower_type_clear_card.is_empty():
		return _build_card("bane", tower_type_clear_card)

	var damage_setback_card: Dictionary = _create_damage_setback_card_config()
	if not damage_setback_card.is_empty():
		return _build_card("bane", damage_setback_card)

	var cards: Array[Dictionary] = [
		{
			"title": GameSession.t("cards.enemyHp.title"),
			"description": GameSession.t("cards.enemyHp.description"),
			"result": GameSession.t("cards.enemyHp.result"),
			"effect": {
				"type": "enemyModifier",
				"stat": "hp",
				"multiplier": 1.18,
				"duration_waves": CARD_EFFECT_DURATION_WAVES
			}
		},
		{
			"title": GameSession.t("cards.enemySpeed.title"),
			"description": GameSession.t("cards.enemySpeed.description"),
			"result": GameSession.t("cards.enemySpeed.result"),
			"effect": {
				"type": "enemyModifier",
				"stat": "speed",
				"multiplier": 1.15,
				"duration_waves": CARD_EFFECT_DURATION_WAVES
			}
		},
		{
			"title": GameSession.t("cards.coinsLoss.title"),
			"description": GameSession.t("cards.coinsLoss.description", {"amount": CARD_COIN_LOSS}),
			"result": GameSession.t("cards.coinsLoss.result", {"amount": CARD_COIN_LOSS}),
			"effect": {"type": "coins", "amount": -CARD_COIN_LOSS}
		},
		{
			"title": GameSession.t("cards.coinsAll.title"),
			"description": GameSession.t("cards.coinsAll.description"),
			"result": GameSession.t("cards.coinsAll.result"),
			"effect": {"type": "coinsAll"}
		}
	]

	var range_setback_card: Dictionary = _create_range_setback_card_config()
	if not range_setback_card.is_empty():
		cards.append(range_setback_card)

	return _build_card("bane", _random_card_config(cards))

func _create_tower_type_clear_card_config() -> Dictionary:
	if not _is_board_filled_with_towers():
		return {}

	var tower_key: String = _get_random_placed_tower_key()
	if tower_key.is_empty():
		return {}

	var tower_label: String = _format_tower_name(tower_key)
	var tower_count: int = _get_placed_tower_count_by_type(tower_key)
	return {
		"title": GameSession.t("cards.towerTypeClear.title", {"tower": tower_label}),
		"description": GameSession.t("cards.towerTypeClear.description", {"tower": tower_label, "count": tower_count}),
		"result": GameSession.t("cards.towerTypeClear.result", {"tower": tower_label, "count": tower_count}),
		"effect": {"type": "removeTowerType", "tower_type": tower_key}
	}

func _create_damage_setback_card_config() -> Dictionary:
	var tower_key: String = _get_random_max_damage_tower_key()
	if tower_key.is_empty():
		return {}

	var tower_label: String = _format_tower_name(tower_key)
	return {
		"title": GameSession.t("cards.damageSetback.title", {"tower": tower_label}),
		"description": GameSession.t("cards.damageSetback.description", {"tower": tower_label}),
		"result": GameSession.t("cards.damageSetback.result", {"tower": tower_label}),
		"effect": {
			"type": "towerBuff",
			"tower_type": tower_key,
			"stat": "damage",
			"multiplier": DAMAGE_SETBACK_MULTIPLIER,
			"permanent": true
		}
	}

func _create_range_setback_card_config() -> Dictionary:
	var tower_key: String = _get_random_max_range_tower_key()
	if tower_key.is_empty():
		return {}

	var tower_label: String = _format_tower_name(tower_key)
	return {
		"title": GameSession.t("cards.rangeSetback.title", {"tower": tower_label}),
		"description": GameSession.t("cards.rangeSetback.description", {"tower": tower_label}),
		"result": GameSession.t("cards.rangeSetback.result", {"tower": tower_label}),
		"effect": {
			"type": "towerBuff",
			"tower_type": tower_key,
			"stat": "range",
			"multiplier": RANGE_SETBACK_MULTIPLIER,
			"permanent": true
		}
	}

func _build_card(card_kind: String, config: Dictionary) -> Dictionary:
	var card: Dictionary = {}
	for key in config:
		card[key] = config[key]
	card["id"] = "%s-%d-%d" % [card_kind, wave, next_card_id]
	card["kind"] = card_kind
	next_card_id += 1
	return card

func _apply_card_effect(card: Dictionary) -> String:
	var effect_value: Variant = card.get("effect", {})
	var effect: Dictionary = {}
	if effect_value is Dictionary:
		effect = effect_value as Dictionary

	var effect_type: String = String(effect.get("type", "none"))
	match effect_type:
		"heal":
			var previous_lives: int = lives
			var heal_amount: int = int(effect.get("amount", 0))
			lives = mini(10, lives + heal_amount)
			if lives > previous_lives:
				return String(card.get("result", ""))
			return GameSession.t("cards.heal.full")
		"coins":
			var previous_coins: int = coins
			var coin_amount: int = int(effect.get("amount", 0))
			coins = maxi(0, coins + coin_amount)
			var coin_difference: int = coins - previous_coins
			if coin_difference > 0:
				return GameSession.t("cards.coinsGain.result", {"amount": coin_difference})
			if coin_difference < 0:
				return GameSession.t("cards.coinsLoss.result", {"amount": abs(coin_difference)})
			return GameSession.t("cards.noCoinsChanged")
		"coinsAll":
			var removed_coins: int = coins
			coins = 0
			if removed_coins > 0:
				return GameSession.t("cards.coinsLoss.result", {"amount": removed_coins})
			return GameSession.t("cards.noCoinsLost")
		"removeTowerType":
			return _remove_towers_by_type(String(effect.get("tower_type", "")))
		"towerBuff":
			_add_tower_buff(effect)
			return String(card.get("result", ""))
		"enemyModifier":
			_add_enemy_modifier(effect)
			return String(card.get("result", ""))
		_:
			return String(card.get("result", ""))

func _remove_towers_by_type(tower_type: String) -> String:
	var tower_label: String = _format_tower_name(tower_type)
	var towers_to_remove: Array[TowerState] = []
	for tower_data in placed_towers:
		if tower_data.tower_type == tower_type:
			towers_to_remove.append(tower_data)

	for tower_to_remove in towers_to_remove:
		_remove_tower(tower_to_remove, 0)

	if towers_to_remove.size() > 0:
		return GameSession.t("cards.towerTypeClear.result", {"tower": tower_label, "count": towers_to_remove.size()})
	return GameSession.t("cards.towerTypeClear.none", {"tower": tower_label})

func _add_tower_buff(effect: Dictionary) -> void:
	var buff: Dictionary = {
		"tower_id": int(effect.get("tower_id", 0)),
		"tower_type": String(effect.get("tower_type", "")),
		"stat": String(effect.get("stat", "")),
		"multiplier": float(effect.get("multiplier", 1.0)),
		"permanent": bool(effect.get("permanent", false)),
		"ignore_max_damage": bool(effect.get("ignore_max_damage", false)),
		"expires_after_wave": _get_card_effect_expiration_wave(effect)
	}
	tower_buffs.append(buff)
	_refresh_placement_preview()

func _add_enemy_modifier(effect: Dictionary) -> void:
	var stat: String = String(effect.get("stat", ""))
	var remaining_modifiers: Array[Dictionary] = []
	for modifier in enemy_modifiers:
		if String(modifier.get("stat", "")) != stat:
			remaining_modifiers.append(modifier)
	enemy_modifiers = remaining_modifiers
	enemy_modifiers.append({
		"stat": stat,
		"multiplier": float(effect.get("multiplier", 1.0)),
		"expires_after_wave": _get_card_effect_expiration_wave(effect)
	})

func _get_card_effect_expiration_wave(effect: Dictionary) -> int:
	if bool(effect.get("permanent", false)):
		return -1
	return wave + int(effect.get("duration_waves", CARD_EFFECT_DURATION_WAVES))

func _clear_expired_card_effects(finished_wave: int) -> void:
	var active_tower_buffs: Array[Dictionary] = []
	for buff in tower_buffs:
		if bool(buff.get("permanent", false)) or int(buff.get("expires_after_wave", -1)) > finished_wave:
			active_tower_buffs.append(buff)
	tower_buffs = active_tower_buffs

	var active_enemy_modifiers: Array[Dictionary] = []
	for modifier in enemy_modifiers:
		if int(modifier.get("expires_after_wave", -1)) > finished_wave:
			active_enemy_modifiers.append(modifier)
	enemy_modifiers = active_enemy_modifiers
	_sync_tower_shop_buttons()
	_refresh_placement_preview()

func _is_card_effect_active(effect: Dictionary) -> bool:
	if bool(effect.get("permanent", false)):
		return true
	return int(effect.get("expires_after_wave", -1)) >= wave

func _get_enemy_modifier_multiplier(stat: String) -> float:
	var multiplier: float = 1.0
	for modifier in enemy_modifiers:
		if String(modifier.get("stat", "")) == stat and _is_card_effect_active(modifier):
			multiplier *= float(modifier.get("multiplier", 1.0))
	return multiplier

func _get_random_damage_buff_tower_key() -> String:
	var tower_keys: Array[String] = []
	for tower_key in GameSession.get_unlocked_tower_keys(current_theme):
		if _can_offer_damage_buff(tower_key):
			tower_keys.append(tower_key)
	return _random_tower_key(tower_keys)

func _get_random_range_buff_tower_key() -> String:
	var tower_keys: Array[String] = []
	for tower_key in GameSession.get_unlocked_tower_keys(current_theme):
		if _can_offer_range_buff(tower_key):
			tower_keys.append(tower_key)
	return _random_tower_key(tower_keys)

func _get_random_placed_tower_key() -> String:
	var tower_keys: Array[String] = []
	for tower_data in placed_towers:
		if not tower_keys.has(tower_data.tower_type):
			tower_keys.append(tower_data.tower_type)
	return _random_tower_key(tower_keys)

func _get_random_placed_tower() -> TowerState:
	if placed_towers.is_empty():
		return null
	var index: int = int(randi() % placed_towers.size())
	return placed_towers[index]

func _get_placed_tower_count_by_type(tower_type: String) -> int:
	var count: int = 0
	for tower_data in placed_towers:
		if tower_data.tower_type == tower_type:
			count += 1
	return count

func _is_board_filled_with_towers() -> bool:
	var fillable_tile_count: int = 0
	for y in range(ROWS):
		for x in range(COLS):
			var tile_position: Vector2i = Vector2i(x, y)
			if path_tiles.has(tile_position) or blocked_tiles.has(tile_position):
				continue
			if not _can_any_unlocked_tower_reach_path(tile_position):
				continue

			fillable_tile_count += 1
			if not occupied_tiles.has(tile_position):
				return false
	return fillable_tile_count > 0

func _can_any_unlocked_tower_reach_path(tile_position: Vector2i) -> bool:
	for tower_key in GameSession.get_unlocked_tower_keys(current_theme):
		if _does_tower_reach_path(tile_position, _get_tower_range(tower_key)):
			return true
	return false

func _get_random_max_damage_tower_key() -> String:
	var tower_keys: Array[String] = []
	for tower_key in GameSession.get_unlocked_tower_keys(current_theme):
		if not _can_offer_damage_buff(tower_key):
			tower_keys.append(tower_key)
	return _random_tower_key(tower_keys)

func _get_random_max_range_tower_key() -> String:
	var tower_keys: Array[String] = []
	for tower_key in GameSession.get_unlocked_tower_keys(current_theme):
		if not _can_offer_range_buff(tower_key):
			tower_keys.append(tower_key)
	return _random_tower_key(tower_keys)

func _can_offer_damage_buff(tower_key: String) -> bool:
	var current_damage: int = _get_tower_damage(tower_key)
	var max_damage: int = _get_tower_max_damage(tower_key)
	return float(current_damage) < float(max_damage) - DAMAGE_MAX_EPSILON

func _can_offer_range_buff(tower_key: String) -> bool:
	return _get_tower_range(tower_key) < MAX_TOWER_RANGE - RANGE_MAX_EPSILON

func _random_tower_key(tower_keys: Array[String]) -> String:
	if tower_keys.is_empty():
		return ""
	var index: int = int(randi() % tower_keys.size())
	return tower_keys[index]

func _random_card_config(cards: Array[Dictionary]) -> Dictionary:
	if cards.is_empty():
		return {}
	var index: int = int(randi() % cards.size())
	return cards[index]

func _shuffle_cards(cards: Array[Dictionary]) -> Array[Dictionary]:
	var shuffled: Array[Dictionary] = []
	for card in cards:
		shuffled.append(card)
	for index in range(shuffled.size()):
		var remaining: int = shuffled.size() - index
		var swap_index: int = index + int(randi() % remaining)
		var current_card: Dictionary = shuffled[index]
		shuffled[index] = shuffled[swap_index]
		shuffled[swap_index] = current_card
	return shuffled

func _get_path_point(path_index: int) -> Vector2:
	var tile_position: Vector2i = path_tiles[path_index]
	return Vector2(float(tile_position.x) + 0.5, float(tile_position.y) + 0.5)

func _load_theme(theme_key: String) -> void:
	GameSession.set_theme(theme_key)
	current_theme = GameSession.theme
	AudioManager.play_theme_music(current_theme)
	path_tiles = _get_theme_path_tiles(current_theme)
	blocked_tiles = _get_theme_blocked_tiles(current_theme)
	_apply_theme_visuals()
	_build_board()
	_ensure_selected_tower_unlocked()
	_sync_tower_shop_buttons()

func _apply_theme_visuals() -> void:
	match current_theme:
		"lagoon":
			_board_stage.color = Color(0.039215688, 0.23529412, 0.3019608, 1.0)
		"lava":
			_board_stage.color = Color(0.21176471, 0.07450981, 0.03529412, 1.0)
		_:
			_board_stage.color = Color(0.05882353, 0.25490198, 0.101960786, 1.0)

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
	tile.mouse_entered.connect(_show_placement_preview.bind(tile_position))
	tile.mouse_exited.connect(_hide_placement_preview_if_tile.bind(tile_position))
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
	if _delete_button.button_pressed:
		_request_tower_delete_at(tile_position)
	else:
		_try_place_tower(tile_position)

func _get_tile_texture(tile_position: Vector2i) -> Texture2D:
	if path_tiles.has(tile_position):
		return _get_theme_path_texture()
	if blocked_tiles.has(tile_position):
		return _get_theme_blocked_texture()

	var detail_index: int = (tile_position.x * 11 + tile_position.y * 17) % 3
	return _get_theme_detail_texture(detail_index)

func _get_theme_detail_texture(detail_index: int) -> Texture2D:
	match current_theme:
		"lagoon":
			if detail_index == 1:
				return TILE_LAGOON_B
			if detail_index == 2:
				return TILE_LAGOON_C
			return TILE_LAGOON_A
		"lava":
			if detail_index == 1:
				return TILE_LAVA_B
			if detail_index == 2:
				return TILE_LAVA_C
			return TILE_LAVA_A
		_:
			if detail_index == 1:
				return TILE_PARK_B
			if detail_index == 2:
				return TILE_PARK_C
			return TILE_PARK_A

func _get_theme_path_texture() -> Texture2D:
	match current_theme:
		"lagoon":
			return TILE_LAGOON_PATH
		"lava":
			return TILE_LAVA_PATH
		_:
			return TILE_PARK_PATH

func _get_theme_blocked_texture() -> Texture2D:
	match current_theme:
		"lagoon":
			return TILE_LAGOON_BLOCKED
		"lava":
			return TILE_LAVA_BLOCKED
		_:
			return TILE_PARK_BLOCKED

func _get_theme_path_tiles(theme_key: String) -> Array[Vector2i]:
	var tiles: Array[Vector2i] = []
	match theme_key:
		"lagoon":
			tiles.append(Vector2i(4, 0))
			tiles.append(Vector2i(5, 0))
			tiles.append(Vector2i(6, 0))
			tiles.append(Vector2i(7, 0))
			tiles.append(Vector2i(7, 1))
			tiles.append(Vector2i(7, 2))
			tiles.append(Vector2i(6, 2))
			tiles.append(Vector2i(5, 2))
			tiles.append(Vector2i(5, 3))
			tiles.append(Vector2i(5, 4))
			tiles.append(Vector2i(6, 4))
			tiles.append(Vector2i(7, 4))
			tiles.append(Vector2i(8, 4))
			tiles.append(Vector2i(8, 5))
			tiles.append(Vector2i(8, 6))
			tiles.append(Vector2i(9, 6))
			tiles.append(Vector2i(10, 6))
			tiles.append(Vector2i(11, 6))
		"lava":
			tiles.append(Vector2i(1, 0))
			tiles.append(Vector2i(2, 0))
			tiles.append(Vector2i(3, 0))
			tiles.append(Vector2i(3, 1))
			tiles.append(Vector2i(4, 1))
			tiles.append(Vector2i(4, 2))
			tiles.append(Vector2i(5, 2))
			tiles.append(Vector2i(5, 3))
			tiles.append(Vector2i(6, 3))
			tiles.append(Vector2i(7, 3))
			tiles.append(Vector2i(8, 3))
			tiles.append(Vector2i(8, 4))
			tiles.append(Vector2i(8, 5))
			tiles.append(Vector2i(9, 5))
			tiles.append(Vector2i(10, 5))
			tiles.append(Vector2i(10, 6))
			tiles.append(Vector2i(10, 7))
			tiles.append(Vector2i(10, 8))
		_:
			tiles.append(Vector2i(3, 0))
			tiles.append(Vector2i(3, 1))
			tiles.append(Vector2i(3, 2))
			tiles.append(Vector2i(4, 2))
			tiles.append(Vector2i(4, 3))
			tiles.append(Vector2i(5, 3))
			tiles.append(Vector2i(6, 3))
			tiles.append(Vector2i(6, 4))
			tiles.append(Vector2i(7, 4))
			tiles.append(Vector2i(8, 4))
			tiles.append(Vector2i(8, 5))
			tiles.append(Vector2i(8, 6))
			tiles.append(Vector2i(9, 6))
			tiles.append(Vector2i(10, 6))
			tiles.append(Vector2i(10, 7))
			tiles.append(Vector2i(10, 8))
	return tiles

func _get_theme_blocked_tiles(theme_key: String) -> Array[Vector2i]:
	var tiles: Array[Vector2i] = []
	match theme_key:
		"lagoon":
			tiles.append(Vector2i(0, 6))
			tiles.append(Vector2i(1, 8))
			tiles.append(Vector2i(3, 1))
			tiles.append(Vector2i(4, 0))
			tiles.append(Vector2i(6, 1))
			tiles.append(Vector2i(8, 7))
			tiles.append(Vector2i(10, 5))
		"lava":
			tiles.append(Vector2i(2, 2))
			tiles.append(Vector2i(3, 2))
			tiles.append(Vector2i(8, 2))
			tiles.append(Vector2i(9, 5))
			tiles.append(Vector2i(5, 7))
		_:
			tiles.append(Vector2i(0, 1))
			tiles.append(Vector2i(1, 4))
			tiles.append(Vector2i(10, 1))
			tiles.append(Vector2i(11, 6))
			tiles.append(Vector2i(2, 8))
			tiles.append(Vector2i(9, 8))
	return tiles

func _get_enemy_texture(tier: int) -> Texture2D:
	if tier == 1:
		return ENEMY_BRUTE_TEXTURE
	if tier == 2:
		return ENEMY_SHIELD_TEXTURE
	return ENEMY_RUNNER_TEXTURE

func _get_enemy_pivot(_tier: int) -> Vector2:
	return ENEMY_PIVOT

func _get_tower_placement_state(tile_position: Vector2i, tower_key: String) -> Dictionary:
	if game_over or victory_pending:
		return _make_tower_placement_state(false, GameSession.t("messages.gameEnded"))
	if paused:
		return _make_tower_placement_state(false, GameSession.t("messages.resumeToBuild"))
	if _delete_button.button_pressed:
		return _make_tower_placement_state(false, GameSession.t("messages.selectTowerToRemove"))
	if not GameSession.is_tower_unlocked(tower_key, current_theme):
		return _make_tower_placement_state(false, GameSession.t("messages.towerLocked", {"tower": _format_tower_name(tower_key)}))

	var tower_cost: int = _get_tower_cost(tower_key)
	if tower_cost <= 0:
		return _make_tower_placement_state(false, GameSession.t("messages.selectTower"))
	if path_tiles.has(tile_position) or blocked_tiles.has(tile_position):
		return _make_tower_placement_state(false, GameSession.t("messages.spaceBlocked"))
	if occupied_tiles.has(tile_position):
		return _make_tower_placement_state(false, GameSession.t("messages.towerExists"))
	if coins < tower_cost:
		return _make_tower_placement_state(false, GameSession.t("messages.notEnoughCoins"))

	var tower_range: float = _get_tower_range(tower_key)
	if not _does_tower_reach_path(tile_position, tower_range):
		return _make_tower_placement_state(false, GameSession.t("messages.towerNoTargets"))

	return _make_tower_placement_state(true, "")

func _make_tower_placement_state(available: bool, message: String) -> Dictionary:
	var placement_state: Dictionary = {}
	placement_state["available"] = available
	placement_state["message"] = message
	return placement_state

func _try_place_tower(tile_position: Vector2i) -> void:
	var tower_key: String = selected_tower
	var placement_state: Dictionary = _get_tower_placement_state(tile_position, tower_key)
	var available: bool = bool(placement_state.get("available", false))
	if not available:
		_show_status(String(placement_state.get("message", GameSession.t("messages.spaceUnavailable"))))
		return

	var tower_cost: int = _get_tower_cost(tower_key)
	var tower_range: float = _get_tower_range(tower_key)
	_place_tower(tile_position, tower_key, tower_cost, tower_range)
	_refresh_placement_preview()

func _place_tower(tile_position: Vector2i, tower_key: String, tower_cost: int, tower_range: float) -> void:
	var tower_texture: Texture2D = _get_tower_texture(tower_key)
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
	_start_undo_placement(tower_data)
	_sync_hud()
	_show_status(GameSession.t("messages.towerCreated", {"tower": _format_tower_name(tower_key), "cost": tower_cost}))

func _start_undo_placement(tower_data: TowerState) -> void:
	last_placed_tower = tower_data
	_undo_placement_timer.start(UNDO_PLACEMENT_WINDOW)
	_sync_tower_action_ui()

func _expire_undo_placement() -> void:
	last_placed_tower = null
	_sync_tower_action_ui()

func _clear_undo_placement() -> void:
	last_placed_tower = null
	if is_instance_valid(_undo_placement_timer):
		_undo_placement_timer.stop()
	_sync_tower_action_ui()

func _is_undo_placement_available() -> bool:
	if last_placed_tower == null:
		return false
	if card_choice_active:
		return false
	if game_over or victory_pending:
		return false
	if not placed_towers.has(last_placed_tower):
		return false
	return _undo_placement_timer.time_left > 0.0

func _get_undo_seconds_remaining() -> int:
	if not _is_undo_placement_available():
		return 0
	return maxi(1, int(ceil(_undo_placement_timer.time_left)))

func _undo_last_tower_placement() -> void:
	if not _is_undo_placement_available():
		_clear_undo_placement()
		_show_status(GameSession.t("messages.nothingToUndo"))
		return

	var tower_data: TowerState = last_placed_tower
	var tower_name: String = _format_tower_name(tower_data.tower_type)
	var refund: int = tower_data.cost
	var removed: bool = _remove_tower(tower_data, refund)
	_clear_undo_placement()

	if removed:
		_show_status(GameSession.t("messages.towerUndone", {"tower": tower_name, "refund": refund}))
	else:
		_show_status(GameSession.t("messages.nothingToUndo"))

func _get_tower_at_tile(tile_position: Vector2i) -> TowerState:
	for tower_data in placed_towers:
		if tower_data.tile_position == tile_position:
			return tower_data
	return null

func _remove_tower(tower_data: TowerState, refund: int) -> bool:
	if tower_data == null:
		return false
	if not placed_towers.has(tower_data):
		return false

	if last_placed_tower != null and last_placed_tower.id == tower_data.id:
		last_placed_tower = null
		if is_instance_valid(_undo_placement_timer):
			_undo_placement_timer.stop()

	if pending_delete_tower != null and pending_delete_tower.id == tower_data.id:
		pending_delete_tower = null

	placed_towers.erase(tower_data)
	occupied_tiles.erase(tower_data.tile_position)
	_remove_projectiles_from_tower(tower_data.id)

	var tower_node: Node = tower_data.node
	if is_instance_valid(tower_node):
		tower_node.queue_free()

	if refund > 0:
		coins += refund

	_refresh_placement_preview()
	_sync_delete_tower_highlights()
	_sync_hud()
	return true

func _remove_projectiles_from_tower(tower_id: int) -> void:
	var tower_projectiles: Array[ProjectileState] = []
	for projectile_data in projectiles:
		if projectile_data.source_tower_id == tower_id:
			tower_projectiles.append(projectile_data)

	for projectile_to_remove in tower_projectiles:
		_remove_projectile(projectile_to_remove)

func _create_range_ring(tile_position: Vector2i, tower_range: float) -> TextureRect:
	var range_node: TextureRect = TextureRect.new()
	range_node.name = "Range_%02d_%02d" % [tile_position.x, tile_position.y]
	range_node.texture = RANGE_RING_TEXTURE
	range_node.size = RANGE_RING_TEXTURE.get_size()
	range_node.stretch_mode = TextureRect.STRETCH_KEEP
	range_node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_configure_range_ring(range_node, tile_position, tower_range, Color(1.0, 0.95, 0.45, 0.22))
	return range_node

func _configure_range_ring(range_node: TextureRect, tile_position: Vector2i, tower_range: float, color: Color) -> void:
	var diameter_pixels: float = tower_range * 2.0 * TILE_SIZE.x
	var ring_scale: float = diameter_pixels / RANGE_RING_BASE_DIAMETER
	range_node.modulate = color
	range_node.scale = Vector2(ring_scale, ring_scale)

	var center: Vector2 = Vector2(float(tile_position.x) + 0.5, float(tile_position.y) + 0.5)
	range_node.position = Vector2(
		center.x * TILE_SIZE.x - RANGE_RING_PIVOT.x * ring_scale,
		center.y * TILE_SIZE.y - RANGE_RING_PIVOT.y * ring_scale
	)

func _ensure_placement_preview_nodes() -> void:
	if not is_instance_valid(preview_range_node):
		preview_range_node = _create_range_ring(Vector2i.ZERO, _get_tower_range(selected_tower))
		preview_range_node.name = "PreviewRange"
		_range_layer.add_child(preview_range_node)
		preview_range_node.hide()

	if not is_instance_valid(preview_tower_node):
		preview_tower_node = TextureRect.new()
		preview_tower_node.name = "PreviewTower"
		preview_tower_node.stretch_mode = TextureRect.STRETCH_KEEP
		preview_tower_node.mouse_filter = Control.MOUSE_FILTER_IGNORE
		_tower_layer.add_child(preview_tower_node)
		preview_tower_node.hide()

func _show_placement_preview(tile_position: Vector2i) -> void:
	if _should_hide_placement_preview():
		_hide_placement_preview()
		return

	preview_visible = true
	preview_tile_position = tile_position
	_render_placement_preview(tile_position)

func _hide_placement_preview_if_tile(tile_position: Vector2i) -> void:
	if preview_visible and preview_tile_position == tile_position:
		_hide_placement_preview()

func _refresh_placement_preview() -> void:
	if not preview_visible:
		return
	if _should_hide_placement_preview():
		_hide_placement_preview()
		return
	_render_placement_preview(preview_tile_position)

func _hide_placement_preview() -> void:
	preview_visible = false
	preview_tile_position = Vector2i(-1, -1)
	if is_instance_valid(preview_range_node):
		preview_range_node.hide()
	if is_instance_valid(preview_tower_node):
		preview_tower_node.hide()
	_clear_preview_path_overlays()

func _should_hide_placement_preview() -> bool:
	return transition_active or paused or game_over or victory_pending or card_choice_active or _delete_button.button_pressed

func _render_placement_preview(tile_position: Vector2i) -> void:
	_ensure_placement_preview_nodes()

	var tower_key: String = selected_tower
	var tower_range: float = _get_tower_range(tower_key)
	var tower_texture: Texture2D = _get_tower_texture(tower_key)
	var placement_state: Dictionary = _get_tower_placement_state(tile_position, tower_key)
	var available: bool = bool(placement_state.get("available", false))
	var preview_color: Color = _get_preview_color(tower_key, available)
	var ghost_color: Color = Color(1.0, 1.0, 1.0, 0.70) if available else Color(1.0, 0.36, 0.32, 0.42)

	preview_range_node.texture = RANGE_RING_TEXTURE
	preview_range_node.size = RANGE_RING_TEXTURE.get_size()
	_configure_range_ring(preview_range_node, tile_position, tower_range, preview_color)
	preview_range_node.show()

	preview_tower_node.texture = tower_texture
	preview_tower_node.size = tower_texture.get_size()
	preview_tower_node.modulate = ghost_color
	preview_tower_node.position = _get_tower_position_for_tile(tile_position)
	preview_tower_node.show()

	_range_layer.move_child(preview_range_node, _range_layer.get_child_count() - 1)
	_tower_layer.move_child(preview_tower_node, _tower_layer.get_child_count() - 1)
	_render_preview_path_overlays(tile_position, tower_range, available)

func _render_preview_path_overlays(tile_position: Vector2i, tower_range: float, available: bool) -> void:
	_clear_preview_path_overlays()
	var overlay_color: Color = _get_preview_path_color(selected_tower, available)
	var path_tiles_in_range: Array[Vector2i] = _get_path_tiles_in_range(tile_position, tower_range)
	for path_tile in path_tiles_in_range:
		var overlay: ColorRect = ColorRect.new()
		overlay.name = "PreviewPath_%02d_%02d" % [path_tile.x, path_tile.y]
		overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
		overlay.color = overlay_color
		overlay.size = TILE_SIZE
		overlay.position = Vector2(float(path_tile.x) * TILE_SIZE.x, float(path_tile.y) * TILE_SIZE.y)
		_range_layer.add_child(overlay)
		preview_path_overlays.append(overlay)

func _clear_preview_path_overlays() -> void:
	for overlay in preview_path_overlays:
		if is_instance_valid(overlay):
			overlay.queue_free()
	preview_path_overlays.clear()

func _get_path_tiles_in_range(tile_position: Vector2i, tower_range: float) -> Array[Vector2i]:
	var tiles_in_range: Array[Vector2i] = []
	var tower_center: Vector2 = Vector2(float(tile_position.x) + 0.5, float(tile_position.y) + 0.5)
	for path_tile in path_tiles:
		var path_center: Vector2 = Vector2(float(path_tile.x) + 0.5, float(path_tile.y) + 0.5)
		if tower_center.distance_to(path_center) <= tower_range:
			tiles_in_range.append(path_tile)
	return tiles_in_range

func _get_preview_color(tower_key: String, available: bool) -> Color:
	if not available:
		return Color(1.0, 0.40, 0.36, 0.42)
	match tower_key:
		"slow":
			return Color(0.49, 0.90, 1.0, 0.38)
		"splash":
			return Color(0.91, 0.71, 0.38, 0.40)
		"flame":
			return Color(1.0, 0.50, 0.19, 0.42)
		_:
			return Color(1.0, 0.97, 0.67, 0.38)

func _get_preview_path_color(tower_key: String, available: bool) -> Color:
	if not available:
		return Color(1.0, 0.40, 0.36, 0.18)
	match tower_key:
		"slow":
			return Color(0.49, 0.90, 1.0, 0.18)
		"splash":
			return Color(0.91, 0.71, 0.38, 0.18)
		"flame":
			return Color(1.0, 0.50, 0.19, 0.19)
		_:
			return Color(1.0, 0.97, 0.67, 0.18)

func _position_tower(tower_data: TowerState) -> void:
	var tower_node: Control = tower_data.node
	if not is_instance_valid(tower_node):
		return

	tower_node.position = _get_tower_position_for_tile(tower_data.tile_position)

func _get_tower_position_for_tile(tile_position: Vector2i) -> Vector2:
	var center: Vector2 = Vector2(
		float(tile_position.x) + 0.5,
		float(tile_position.y) + 0.5
	)
	return Vector2(
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
	var stats: Dictionary = _get_tower_combat_stats(tower_key, 0)
	return float(stats.get("range", 0.0))

func _get_base_tower_range(tower_key: String) -> float:
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
	var stats: Dictionary = _get_tower_combat_stats(tower_key, 0)
	return int(stats.get("damage", 0))

func _get_base_tower_damage(tower_key: String) -> int:
	match tower_key:
		"slow":
			return 7
		"splash":
			return 24
		"flame":
			return 9
		_:
			return 18

func _get_tower_max_damage(tower_key: String) -> int:
	match tower_key:
		"slow":
			return 25
		"splash":
			return 55
		"flame":
			return 28
		_:
			return 62

func _get_tower_combat_stats(tower_key: String, tower_id: int) -> Dictionary:
	var damage: int = _get_base_tower_damage(tower_key)
	var tower_range: float = _get_base_tower_range(tower_key)
	var max_damage: int = _get_tower_max_damage(tower_key)
	var ignore_max_damage: bool = false

	for buff in tower_buffs:
		if String(buff.get("tower_type", "")) != tower_key:
			continue
		var buff_tower_id: int = int(buff.get("tower_id", 0))
		if buff_tower_id > 0 and buff_tower_id != tower_id:
			continue
		if not _is_card_effect_active(buff):
			continue

		var stat: String = String(buff.get("stat", ""))
		var multiplier: float = float(buff.get("multiplier", 1.0))
		if stat == "damage":
			var next_damage: int = maxi(1, int(round(float(damage) * multiplier)))
			if bool(buff.get("ignore_max_damage", false)):
				ignore_max_damage = true
				damage = next_damage
			else:
				damage = mini(max_damage, next_damage)
		elif stat == "range":
			tower_range = minf(MAX_TOWER_RANGE, tower_range * multiplier)

	if not ignore_max_damage:
		damage = mini(max_damage, damage)

	return {
		"damage": damage,
		"range": tower_range
	}

func _get_tower_combat_stats_for_tower(tower_data: TowerState) -> Dictionary:
	if tower_data == null:
		return {}
	return _get_tower_combat_stats(tower_data.tower_type, tower_data.id)

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
	var tower_stats: Dictionary = _get_tower_combat_stats_for_tower(tower_data)
	var tower_range: float = float(tower_stats.get("range", tower_data.range))

	for enemy_data in enemies:
		var distance: float = tower_center.distance_to(enemy_data.grid_position)
		if distance > tower_range:
			continue

		var progress: float = float(enemy_data.path_index) + distance / 10.0
		if progress > best_progress:
			best_target = enemy_data
			best_progress = progress

	return best_target

func _fire_projectile(tower_data: TowerState, target: EnemyState) -> void:
	var tower_stats: Dictionary = _get_tower_combat_stats_for_tower(tower_data)
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
	projectile_data.damage = int(tower_stats.get("damage", tower_data.damage))
	projectile_data.speed = tower_data.projectile_speed
	projectile_data.slow_factor = tower_data.slow_factor
	projectile_data.slow_duration = tower_data.slow_duration
	projectile_data.splash = tower_data.splash
	projectile_data.pivot = _get_projectile_pivot(tower_data.tower_type)
	next_projectile_id += 1
	projectiles.append(projectile_data)
	_position_projectile(projectile_data)
	AudioManager.play_sfx("projectileThrow")

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
	_configure_tower_shop_button(_tower_buttons["sentinel"] as Button, "sentinel")
	_configure_tower_shop_button(_tower_buttons["slow"] as Button, "slow")
	_configure_tower_shop_button(_tower_buttons["splash"] as Button, "splash")
	_configure_tower_shop_button(_tower_buttons["flame"] as Button, "flame")

func _sync_tower_shop_buttons() -> void:
	_apply_tower_button_icons()
	for tower_key in _tower_buttons:
		var tower_key_string: String = str(tower_key)
		var button: Button = _tower_buttons[tower_key_string] as Button
		var unlocked: bool = GameSession.is_tower_unlocked(tower_key_string, current_theme)
		button.disabled = card_choice_active or not unlocked
		button.button_pressed = unlocked and tower_key_string == selected_tower

func _ensure_selected_tower_unlocked() -> void:
	if GameSession.is_tower_unlocked(selected_tower, current_theme):
		return

	var unlocked_towers: Array[String] = GameSession.get_unlocked_tower_keys(current_theme)
	if unlocked_towers.is_empty():
		selected_tower = "sentinel"
		return
	selected_tower = unlocked_towers[0]

func _configure_tower_shop_button(button: Button, tower_key: String) -> void:
	if button == null:
		return

	button.icon = null
	button.expand_icon = false
	button.text = "%s\n$%d\n%s\n%s" % [
		_format_tower_name(tower_key),
		_get_tower_cost(tower_key),
		GameSession.t("shop.attackShort", {"attack": _get_tower_damage(tower_key)}),
		GameSession.t("shop.rangeShort", {"range": "%.1f" % _get_tower_range(tower_key)})
	]

func _connect_buttons() -> void:
	_delete_button.toggle_mode = true
	_pause_button.toggle_mode = true
	_speed_button.toggle_mode = true

	_restart_button.pressed.connect(_start_run)
	_menu_button.pressed.connect(_return_to_menu)
	_victory_continue_button.pressed.connect(_continue_to_next_theme)
	_victory_restart_button.pressed.connect(_start_run)
	_victory_menu_button.pressed.connect(_return_to_menu)
	_undo_button.pressed.connect(_undo_last_tower_placement)
	_delete_button.pressed.connect(_toggle_delete_mode)
	_tower_delete_confirm_remove_button.pressed.connect(_confirm_tower_delete)
	_tower_delete_confirm_cancel_button.pressed.connect(_cancel_tower_delete)
	_undo_placement_timer.timeout.connect(_expire_undo_placement)
	_pause_button.pressed.connect(_toggle_pause)
	_speed_button.pressed.connect(_toggle_speed)
	_floating_message_timer.timeout.connect(_hide_floating_message)
	_wave_banner_timer.timeout.connect(_hide_wave_banner)
	_card_choice_continue_button.pressed.connect(_continue_card_choice)

	for index in range(_card_choice_buttons.size()):
		var card_button: Button = _card_choice_buttons[index]
		card_button.pressed.connect(_select_card_choice_index.bind(index))

	for tower_key in _tower_buttons:
		var tower_key_string: String = str(tower_key)
		var button: Button = _tower_buttons[tower_key_string] as Button
		button.toggle_mode = true
		button.pressed.connect(_select_tower.bind(tower_key_string))

func _continue_to_next_theme() -> void:
	if transition_active:
		return

	var next_theme: String = GameSession.get_next_theme(current_theme)
	if next_theme.is_empty():
		return

	transition_active = true
	_victory_continue_button.disabled = true
	_theme_transition_label.text = GameSession.get_theme_name(next_theme)
	_theme_transition_overlay.modulate = Color(1.0, 1.0, 1.0, 0.0)
	_theme_transition_overlay.show()
	_theme_transition_overlay.move_to_front()

	var fade_out_tween: Tween = create_tween()
	fade_out_tween.set_trans(Tween.TRANS_SINE)
	fade_out_tween.set_ease(Tween.EASE_IN_OUT)
	fade_out_tween.tween_property(_theme_transition_overlay, "modulate", Color.WHITE, 0.24)
	await fade_out_tween.finished

	GameSession.set_theme(next_theme)
	_start_run()

	var hold_tween: Tween = create_tween()
	hold_tween.tween_interval(0.16)
	await hold_tween.finished

	var fade_in_tween: Tween = create_tween()
	fade_in_tween.set_trans(Tween.TRANS_SINE)
	fade_in_tween.set_ease(Tween.EASE_IN_OUT)
	fade_in_tween.tween_property(_theme_transition_overlay, "modulate", Color(1.0, 1.0, 1.0, 0.0), 0.28)
	await fade_in_tween.finished

	_theme_transition_overlay.hide()
	transition_active = false
	_sync_tower_action_ui()

func _apply_static_translations() -> void:
	_restart_button.tooltip_text = GameSession.t("shop.restart")
	_menu_button.tooltip_text = GameSession.t("common.menu")
	_difficulty_label.text = GameSession.t("difficulty.title")
	_waves_label.text = GameSession.t("difficulty.waves")
	_cards_label.text = GameSession.t("settings.cards")
	_victory_time_label.text = GameSession.t("hud.timeLabel")
	_victory_wave_label.text = GameSession.t("hud.wave")
	_victory_defeated_label.text = GameSession.t("hud.defeatedLabel")
	_victory_continue_button.text = GameSession.t("common.continue")
	_victory_restart_button.text = GameSession.t("victory.restart")
	_victory_menu_button.text = GameSession.t("common.menu")
	_tower_delete_confirm_title.text = GameSession.t("confirm.towerDeleteTitle")
	_tower_delete_confirm_summary.text = GameSession.t("confirm.towerDeleteSummary")
	_tower_delete_confirm_remove_button.text = GameSession.t("common.remove")
	_tower_delete_confirm_cancel_button.text = GameSession.t("common.cancel")
	_card_choice_kicker.text = GameSession.t("cards.kicker")
	_card_choice_title.text = GameSession.t("cards.choose")
	_card_choice_continue_button.text = GameSession.t("common.continue")
	_set_pause_state(paused)
	_sync_session_labels()
	_sync_hud()

func _sync_session_labels() -> void:
	_difficulty_value.text = _format_difficulty(GameSession.difficulty)
	_waves_value.text = str(wave_limit)
	_cards_value.text = _format_card_frequency(GameSession.card_frequency)

func _sync_hud() -> void:
	_lives_label.text = GameSession.t("hud.lives", {"count": lives})
	_wave_label.text = GameSession.t("hud.waveProgress", {"wave": wave, "limit": wave_limit})
	_defeated_label.text = GameSession.t("hud.defeated", {"count": session_defeated})
	_time_label.text = GameSession.t("hud.time", {"time": _format_session_time(session_time)})
	_money_label.text = str(coins)
	_sync_tower_action_ui()

func _sync_tower_action_ui() -> void:
	var can_undo: bool = _is_undo_placement_available()
	_undo_button.visible = can_undo
	_undo_button.disabled = not can_undo
	if can_undo:
		_undo_button.text = "%s\n%ds" % [GameSession.t("shop.undo"), _get_undo_seconds_remaining()]
	else:
		_undo_button.text = GameSession.t("shop.undo")

	var delete_active: bool = _delete_button.button_pressed and not game_over and not victory_pending and not card_choice_active
	if _delete_button.button_pressed != delete_active:
		_delete_button.set_pressed_no_signal(delete_active)
	_delete_button.disabled = transition_active or game_over or victory_pending or card_choice_active or _tower_delete_confirm_overlay.visible
	_delete_button.text = "%s\n%s" % [
		GameSession.t("shop.delete"),
		GameSession.t("common.cancel") if delete_active else GameSession.t("shop.select")
	]
	_pause_button.disabled = transition_active or game_over or victory_pending or card_choice_active
	_speed_button.disabled = transition_active or game_over or victory_pending or card_choice_active
	_restart_button.disabled = transition_active or card_choice_active
	_menu_button.disabled = transition_active or card_choice_active

func _show_victory_overlay() -> void:
	var has_next_theme: bool = GameSession.has_next_theme(current_theme)
	_victory_title.text = _get_victory_title()
	_victory_summary.text = GameSession.t("victory.summary")
	_victory_time_value.text = _format_session_time(session_time)
	_victory_wave_value.text = "%d/%d" % [wave, wave_limit]
	_victory_defeated_value.text = str(session_defeated)
	_victory_continue_button.visible = has_next_theme
	_victory_continue_button.disabled = not has_next_theme
	_hide_floating_message()
	_hide_wave_banner()
	_victory_overlay.show()
	if has_next_theme:
		_victory_continue_button.call_deferred("grab_focus")
	else:
		_victory_restart_button.call_deferred("grab_focus")

func _hide_victory_overlay() -> void:
	_victory_overlay.hide()

func _select_tower(tower_key: String) -> void:
	if card_choice_active:
		_sync_tower_shop_buttons()
		return
	if not GameSession.is_tower_unlocked(tower_key, current_theme):
		_sync_tower_shop_buttons()
		_show_status(GameSession.t("messages.towerLocked", {"tower": _format_tower_name(tower_key)}))
		return

	selected_tower = tower_key
	for key in _tower_buttons:
		var tower_key_string: String = str(key)
		var button: Button = _tower_buttons[tower_key_string] as Button
		button.button_pressed = tower_key_string == selected_tower
	_refresh_placement_preview()
	_show_status(GameSession.t("messages.towerSelected", {"tower": _format_tower_name(selected_tower)}))

func _toggle_delete_mode() -> void:
	if _delete_button.button_pressed:
		if game_over or victory_pending:
			_set_delete_mode(false, GameSession.t("messages.gameEnded"), true)
			return
		_set_delete_mode(true, GameSession.t("messages.selectTowerToRemove"), true)
	else:
		_set_delete_mode(false, GameSession.t("messages.buildModeRestored"), true)

func _toggle_pause() -> void:
	if card_choice_active:
		_pause_button.set_pressed_no_signal(paused)
		return
	_set_pause_state(_pause_button.button_pressed)
	_show_status(GameSession.t("messages.pause") if paused else GameSession.t("messages.resume"))

func _set_pause_state(is_paused: bool) -> void:
	paused = is_paused
	_pause_button.set_pressed_no_signal(paused)
	if paused:
		_hide_placement_preview()
	else:
		_refresh_placement_preview()
	_pause_button.text = GameSession.t("actions.resume") if paused else GameSession.t("actions.pause")

func _set_delete_mode(active: bool, status_text: String, show_message: bool) -> void:
	var allowed: bool = active and not game_over and not victory_pending and not card_choice_active
	_delete_button.set_pressed_no_signal(allowed)
	if allowed:
		_hide_placement_preview()
	else:
		pending_delete_tower = null
		_refresh_placement_preview()
	_sync_delete_tower_highlights()
	_sync_tower_action_ui()
	if show_message and not status_text.is_empty():
		_show_status(status_text)

func _request_tower_delete_at(tile_position: Vector2i) -> void:
	if card_choice_active:
		return
	if game_over or victory_pending:
		_set_delete_mode(false, GameSession.t("messages.gameEnded"), true)
		return

	var tower_data: TowerState = _get_tower_at_tile(tile_position)
	if tower_data == null:
		_show_status(GameSession.t("messages.selectTowerToRemove"))
		return

	_request_tower_delete(tower_data)

func _request_tower_delete(tower_data: TowerState) -> void:
	if tower_data == null or not placed_towers.has(tower_data):
		_show_status(GameSession.t("messages.towerNotFound"))
		return

	pending_delete_tower = tower_data
	delete_confirm_previous_paused = paused
	_set_pause_state(true)
	_hide_placement_preview()
	_sync_delete_tower_highlights()
	_show_tower_delete_confirm_overlay()
	_show_status(GameSession.t("messages.removeThisTower"))

func _confirm_tower_delete() -> void:
	var tower_data: TowerState = pending_delete_tower
	var restore_paused: bool = delete_confirm_previous_paused
	var tower_name: String = GameSession.t("messages.selectTower")
	if tower_data != null:
		tower_name = _format_tower_name(tower_data.tower_type)

	_hide_tower_delete_confirm_overlay()
	var removed: bool = _remove_tower(tower_data, 0)
	_set_pause_state(restore_paused)
	_set_delete_mode(false, "", false)

	if removed:
		_show_status(GameSession.t("messages.towerRemoved", {"tower": tower_name}))
	else:
		_show_status(GameSession.t("messages.towerNotFound"))

func _cancel_tower_delete() -> void:
	var restore_paused: bool = delete_confirm_previous_paused
	pending_delete_tower = null
	_hide_tower_delete_confirm_overlay()
	_set_pause_state(restore_paused)
	_set_delete_mode(false, GameSession.t("messages.buildModeRestored"), true)

func _show_tower_delete_confirm_overlay() -> void:
	_tower_delete_confirm_overlay.show()
	_tower_delete_confirm_overlay.move_to_front()
	_sync_tower_action_ui()
	_tower_delete_confirm_remove_button.call_deferred("grab_focus")

func _hide_tower_delete_confirm_overlay() -> void:
	_tower_delete_confirm_overlay.hide()
	_sync_tower_action_ui()

func _sync_delete_tower_highlights() -> void:
	var delete_active: bool = _delete_button.button_pressed and not game_over and not victory_pending
	for tower_data in placed_towers:
		var tower_node: CanvasItem = tower_data.node
		if not is_instance_valid(tower_node):
			continue
		if pending_delete_tower != null and pending_delete_tower.id == tower_data.id:
			tower_node.modulate = Color(1.0, 0.48, 0.36, 1.0)
		elif delete_active:
			tower_node.modulate = Color(1.0, 0.84, 0.58, 1.0)
		else:
			tower_node.modulate = Color.WHITE

func _toggle_speed() -> void:
	speed_multiplier = 2.0 if _speed_button.button_pressed else 1.0
	_speed_button.text = "2x" if _speed_button.button_pressed else "1x"
	_show_status(GameSession.t("messages.speedFast") if _speed_button.button_pressed else GameSession.t("messages.speedNormal"))

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
	last_placed_tower = null
	pending_delete_tower = null
	delete_confirm_previous_paused = false
	for tower_data in placed_towers:
		var tower_node: Node = tower_data.node
		if is_instance_valid(tower_node):
			tower_node.queue_free()
	placed_towers.clear()
	occupied_tiles.clear()
	next_tower_id = 1
	for child_index in range(_tower_layer.get_child_count()):
		var child: Node = _tower_layer.get_child(child_index)
		if child != preview_tower_node:
			child.queue_free()
	_clear_preview_path_overlays()

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
	GameSession.set_theme(GameSession.get_first_theme())
	AudioManager.play_menu_music()
	var error: int = get_tree().change_scene_to_file(MAIN_MENU_SCENE)
	if error != OK:
		_show_status(GameSession.t("messages.returnMenuError"))

func _format_session_time(value: float) -> String:
	var total_seconds: int = int(floor(value))
	var minutes: int = int(total_seconds / 60)
	var seconds: int = total_seconds % 60
	return "%02d:%02d" % [minutes, seconds]

func _get_victory_title() -> String:
	return GameSession.get_victory_title(current_theme)

func _format_difficulty(difficulty: String) -> String:
	match difficulty:
		"easy":
			return GameSession.t("difficulty.easy")
		"medium":
			return GameSession.t("difficulty.medium")
		"hard":
			return GameSession.t("difficulty.hard")
		"custom":
			return GameSession.t("difficulty.custom")
		_:
			return GameSession.t("difficulty.medium")

func _format_tower_name(tower_key: String) -> String:
	match tower_key:
		"sentinel":
			return GameSession.t("towers.sentinel")
		"slow":
			return GameSession.t("towers.slow")
		"splash":
			return GameSession.t("towers.splash")
		"flame":
			return GameSession.t("towers.flame")
		_:
			return GameSession.t("towers.sentinel")

func _format_card_frequency(value: int) -> String:
	if value <= 0:
		return GameSession.t("settings.cardFrequencyOff")
	if value == 1:
		return GameSession.t("settings.cardFrequencyOne")
	return GameSession.t("settings.cardFrequencyMany", {"count": value})
