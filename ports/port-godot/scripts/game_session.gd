extends Node

const DEFAULT_DIFFICULTY: String = "medium"
const DEFAULT_WAVE_LIMIT: int = 12
const DEFAULT_CUSTOM_WAVES: int = 20
const DEFAULT_CARD_FREQUENCY: int = 3
const DEFAULT_CONTROLLER_LAYOUT: String = "xbox"
const DEFAULT_LANGUAGE: String = "pt-BR"
const DEFAULT_THEME: String = "park"
const DEFAULT_BGM_VOLUME: float = 1.0
const DEFAULT_SFX_VOLUME: float = 1.0
const SETTINGS_PATH: String = "user://settings.cfg"
const SAVE_PATH: String = "user://save_game.json"
const SAVE_VERSION: int = 1

var difficulty: String = DEFAULT_DIFFICULTY
var wave_limit: int = DEFAULT_WAVE_LIMIT
var custom_waves: int = DEFAULT_CUSTOM_WAVES
var card_frequency: int = DEFAULT_CARD_FREQUENCY
var controller_layout: String = DEFAULT_CONTROLLER_LAYOUT
var language: String = DEFAULT_LANGUAGE
var theme: String = DEFAULT_THEME
var bgm_enabled: bool = true
var sfx_enabled: bool = true
var bgm_volume: float = DEFAULT_BGM_VOLUME
var sfx_volume: float = DEFAULT_SFX_VOLUME

var _translations_registered: bool = false
var _saved_game_load_requested: bool = false

func _ready() -> void:
	_register_translations()
	_load_settings()
	apply_language(language, false)

func reset() -> void:
	difficulty = DEFAULT_DIFFICULTY
	wave_limit = DEFAULT_WAVE_LIMIT
	custom_waves = DEFAULT_CUSTOM_WAVES
	card_frequency = DEFAULT_CARD_FREQUENCY
	controller_layout = DEFAULT_CONTROLLER_LAYOUT
	theme = DEFAULT_THEME
	bgm_enabled = true
	sfx_enabled = true
	bgm_volume = DEFAULT_BGM_VOLUME
	sfx_volume = DEFAULT_SFX_VOLUME

func set_bgm_enabled(enabled: bool, save_setting: bool = true) -> void:
	bgm_enabled = enabled
	if save_setting:
		_save_settings()

func set_sfx_enabled(enabled: bool, save_setting: bool = true) -> void:
	sfx_enabled = enabled
	if save_setting:
		_save_settings()

func set_bgm_volume(volume: float, save_setting: bool = true) -> void:
	bgm_volume = clampf(volume, 0.0, 1.0)
	if save_setting:
		_save_settings()

func set_sfx_volume(volume: float, save_setting: bool = true) -> void:
	sfx_volume = clampf(volume, 0.0, 1.0)
	if save_setting:
		_save_settings()

func set_theme(theme_code: String) -> void:
	theme = _normalize_theme(theme_code)

func get_first_theme() -> String:
	return DEFAULT_THEME

func get_next_theme(theme_code: String = "") -> String:
	var normalized_theme: String = theme
	if not theme_code.is_empty():
		normalized_theme = _normalize_theme(theme_code)

	match normalized_theme:
		"park":
			return "lagoon"
		"lagoon":
			return "lava"
		_:
			return ""

func has_next_theme(theme_code: String = "") -> bool:
	return not get_next_theme(theme_code).is_empty()

func get_theme_name(theme_code: String = "") -> String:
	var normalized_theme: String = theme
	if not theme_code.is_empty():
		normalized_theme = _normalize_theme(theme_code)
	return t("themes." + normalized_theme)

func get_victory_title(theme_code: String = "") -> String:
	var normalized_theme: String = theme
	if not theme_code.is_empty():
		normalized_theme = _normalize_theme(theme_code)
	return t("victory." + normalized_theme)

func get_unlocked_tower_keys(theme_code: String = "") -> Array[String]:
	var normalized_theme: String = theme
	if not theme_code.is_empty():
		normalized_theme = _normalize_theme(theme_code)

	var tower_keys: Array[String] = []
	match normalized_theme:
		"park":
			tower_keys.append("sentinel")
			tower_keys.append("slow")
		"lagoon":
			tower_keys.append("sentinel")
			tower_keys.append("slow")
			tower_keys.append("splash")
		_:
			tower_keys.append("sentinel")
			tower_keys.append("slow")
			tower_keys.append("splash")
			tower_keys.append("flame")
	return tower_keys

func is_tower_unlocked(tower_key: String, theme_code: String = "") -> bool:
	return get_unlocked_tower_keys(theme_code).has(tower_key)

func save_game_snapshot(state_snapshot: Dictionary) -> bool:
	var snapshot: Dictionary = {
		"version": SAVE_VERSION,
		"saved_at": Time.get_unix_time_from_system(),
		"state": state_snapshot
	}
	var file: FileAccess = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		return false

	file.store_string(JSON.stringify(snapshot))
	return true

func load_game_state_snapshot() -> Dictionary:
	var snapshot: Dictionary = _read_saved_game_snapshot()
	if snapshot.is_empty():
		return {}

	var state_value: Variant = snapshot.get("state", {})
	if not (state_value is Dictionary):
		return {}
	return state_value as Dictionary

func has_saved_game() -> bool:
	return not _read_saved_game_snapshot().is_empty()

func clear_saved_game() -> void:
	_saved_game_load_requested = false
	if not FileAccess.file_exists(SAVE_PATH):
		return

	var directory: DirAccess = DirAccess.open("user://")
	if directory != null:
		directory.remove("save_game.json")

func request_saved_game_load() -> bool:
	if not has_saved_game():
		_saved_game_load_requested = false
		return false

	_saved_game_load_requested = true
	return true

func consume_saved_game_load_request() -> bool:
	var requested: bool = _saved_game_load_requested
	_saved_game_load_requested = false
	return requested

func cancel_saved_game_load_request() -> void:
	_saved_game_load_requested = false

func apply_language(language_code: String, save_setting: bool = true) -> void:
	language = _normalize_language(language_code)
	TranslationServer.set_locale(_to_godot_locale(language))
	if save_setting:
		_save_settings()

func t(key: String, params: Dictionary = {}) -> String:
	var translated: String = String(TranslationServer.translate(key))
	if translated == key and language != DEFAULT_LANGUAGE:
		var fallback_messages: Dictionary = _get_translation_messages(DEFAULT_LANGUAGE)
		translated = String(fallback_messages.get(key, key))
	if params.is_empty():
		return translated
	return translated.format(params)

func _register_translations() -> void:
	if _translations_registered:
		return

	for language_code in ["pt-BR", "en", "es"]:
		var translation: Translation = Translation.new()
		translation.locale = _to_godot_locale(language_code)
		var messages: Dictionary = _get_translation_messages(language_code)
		for key in messages:
			translation.add_message(StringName(str(key)), StringName(str(messages[key])))
		TranslationServer.add_translation(translation)

	_translations_registered = true

func _normalize_language(language_code: String) -> String:
	if language_code == "en" or language_code == "es" or language_code == "pt-BR":
		return language_code
	return DEFAULT_LANGUAGE

func _normalize_theme(theme_code: String) -> String:
	if theme_code == "park" or theme_code == "lagoon" or theme_code == "lava":
		return theme_code
	return DEFAULT_THEME

func _to_godot_locale(language_code: String) -> String:
	if language_code == "pt-BR":
		return "pt_BR"
	return language_code

func _load_settings() -> void:
	var config: ConfigFile = ConfigFile.new()
	var error: int = config.load(SETTINGS_PATH)
	if error != OK:
		return

	language = _normalize_language(String(config.get_value("settings", "language", DEFAULT_LANGUAGE)))
	bgm_enabled = bool(config.get_value("settings", "bgm_enabled", true))
	sfx_enabled = bool(config.get_value("settings", "sfx_enabled", true))
	bgm_volume = clampf(float(config.get_value("settings", "bgm_volume", DEFAULT_BGM_VOLUME)), 0.0, 1.0)
	sfx_volume = clampf(float(config.get_value("settings", "sfx_volume", DEFAULT_SFX_VOLUME)), 0.0, 1.0)

func _save_settings() -> void:
	var config: ConfigFile = ConfigFile.new()
	config.set_value("settings", "language", language)
	config.set_value("settings", "bgm_enabled", bgm_enabled)
	config.set_value("settings", "sfx_enabled", sfx_enabled)
	config.set_value("settings", "bgm_volume", bgm_volume)
	config.set_value("settings", "sfx_volume", sfx_volume)
	config.save(SETTINGS_PATH)

func _read_saved_game_snapshot() -> Dictionary:
	if not FileAccess.file_exists(SAVE_PATH):
		return {}

	var file: FileAccess = FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		return {}

	var json_text: String = file.get_as_text()
	var parsed_value: Variant = JSON.parse_string(json_text)
	if not (parsed_value is Dictionary):
		clear_saved_game()
		return {}

	var snapshot: Dictionary = parsed_value as Dictionary
	if not _is_valid_save_snapshot(snapshot):
		clear_saved_game()
		return {}

	return snapshot

func _is_valid_save_snapshot(snapshot: Dictionary) -> bool:
	if int(snapshot.get("version", 0)) != SAVE_VERSION:
		return false

	var state_value: Variant = snapshot.get("state", {})
	if not (state_value is Dictionary):
		return false

	var state_snapshot: Dictionary = state_value as Dictionary
	var theme_code: String = String(state_snapshot.get("theme", ""))
	if _normalize_theme(theme_code) != theme_code:
		return false

	var array_keys: Array[String] = [
		"towers",
		"enemies",
		"projectiles",
		"impacts",
		"tower_buffs",
		"enemy_modifiers"
	]
	for array_key in array_keys:
		var array_value: Variant = state_snapshot.get(array_key, [])
		if not (array_value is Array):
			return false

	return true

func _get_translation_messages(language_code: String) -> Dictionary:
	match language_code:
		"en":
			return {
				"actions.pause": "Pause",
				"actions.resume": "Resume",
				"common.back": "Back",
				"common.cancel": "Cancel",
				"common.continue": "Continue",
				"common.menu": "Menu",
				"common.remove": "Remove",
				"common.start": "Start",
				"cards.cardIndex": "Card {index}",
				"cards.choose": "Choose a card",
				"cards.defaultKind": "Card",
				"cards.coinsAll.description": "Lose all coins now.",
				"cards.coinsAll.result": "You lost all coins.",
				"cards.coinsAll.title": "Total confiscation",
				"cards.coinsGain.description": "Gain {amount} coins now.",
				"cards.coinsGain.result": "You gained {amount} coins.",
				"cards.coinsGain.title": "Prize cleanup",
				"cards.coinsLoss.description": "Lose up to {amount} coins now.",
				"cards.coinsLoss.result": "You lost {amount} coins.",
				"cards.coinsLoss.title": "Cleanup toll",
				"cards.damage.description": "{tower}: permanent +30% damage, max {max}.",
				"cards.damage.result": "{tower} gained permanent damage up to {max}.",
				"cards.damage.title": "{tower} reinforced",
				"cards.damageSetback.description": "{tower}: permanent -23% damage.",
				"cards.damageSetback.result": "{tower} lost 23% permanent damage.",
				"cards.damageSetback.title": "{tower} disrupted",
				"cards.enemyHp.description": "Enemies: +18% HP next wave.",
				"cards.enemyHp.result": "Enemies will have +18% HP next wave.",
				"cards.enemyHp.title": "Reinforced trash",
				"cards.enemySpeed.description": "Enemies: +15% speed next wave.",
				"cards.enemySpeed.result": "Enemies will have +15% speed next wave.",
				"cards.enemySpeed.title": "Toxic rush",
				"cards.heal.description": "Recover 1 HP now.",
				"cards.heal.full": "Life was already full. Nothing changed.",
				"cards.heal.result": "You recovered 1 HP.",
				"cards.heal.title": "Extra breath",
				"cards.kicker": "Choose a card",
				"cards.kind.bane": "Setback",
				"cards.kind.boon": "Bonus",
				"cards.kind.bonus": "Bonus",
				"cards.kind.improvement": "Upgrade",
				"cards.kind.neutral": "Neutral",
				"cards.kind.setback": "Setback",
				"cards.neutral.description": "The next wave stays normal.",
				"cards.neutral.result": "Nothing happens. The next wave comes at the normal pace.",
				"cards.neutral.title": "Nothing changed",
				"cards.noCoinsChanged": "No coins to change. Nothing changed.",
				"cards.noCoinsLost": "No coins to lose. Nothing changed.",
				"cards.powerSurge.description": "One {tower}: doubled damage next wave.",
				"cards.powerSurge.result": "One {tower} will have doubled damage next wave.",
				"cards.powerSurge.title": "{tower} power surge",
				"cards.range.description": "{tower}: permanent +25% range.",
				"cards.range.result": "{tower} gained permanent +25% range.",
				"cards.range.title": "{tower} expanded",
				"cards.rangeSetback.description": "{tower}: permanent -20% range.",
				"cards.rangeSetback.result": "{tower} lost 20% permanent range.",
				"cards.rangeSetback.title": "{tower} overloaded",
				"cards.towerTypeClear.description": "Remove every {tower} tower from the board.",
				"cards.towerTypeClear.none": "No {tower} tower to remove.",
				"cards.towerTypeClear.result": "Removed {count} {tower} towers.",
				"cards.towerTypeClear.title": "{tower} sweep",
				"confirm.towerDeleteSummary": "The tower will be removed with no refund.",
				"confirm.towerDeleteTitle": "Remove this tower?",
				"controls.controller": "Controller",
				"difficulty.custom": "Custom",
				"difficulty.easy": "Easy",
				"difficulty.hard": "Hard",
				"difficulty.medium": "Medium",
				"difficulty.title": "Difficulty",
				"difficulty.waves": "Waves",
				"hud.defeated": "Defeated {count}",
				"hud.defeatedLabel": "Defeated",
				"hud.lives": "Lives {count}",
				"hud.time": "Time {time}",
				"hud.timeLabel": "Time",
				"hud.wave": "Wave",
				"hud.waveProgress": "Wave {wave}/{limit}",
				"menu.config": "Settings",
				"menu.continue": "Continue",
				"menu.demoReady": "Godot demo ready.",
				"menu.exit": "Exit",
				"menu.play": "Play",
				"messages.allWavesDone": "All waves were completed.",
				"messages.buildModeRestored": "Build mode restored.",
				"messages.cancelDeleteToBuild": "Cancel Delete to build.",
				"messages.gameEnded": "Match ended.",
				"messages.nextWaveSoon": "Wave {wave} completed. Next wave soon.",
				"messages.noSavedGame": "No saved game found.",
				"messages.notEnoughCoins": "Not enough coins.",
				"messages.nothingToUndo": "Nothing to undo.",
				"messages.parkLostLives": "The park lost all lives.",
				"messages.prepareWave": "Preparing wave {wave}.",
				"messages.resumeToBuild": "Resume the game to build.",
				"messages.selectTower": "Select a tower.",
				"messages.selectTowerToRemove": "Select a tower to remove.",
				"messages.spaceBlocked": "Blocked space.",
				"messages.spaceUnavailable": "Space unavailable.",
				"messages.speedFast": "2x speed.",
				"messages.speedNormal": "1x speed.",
				"messages.towerCreated": "{tower} built for {cost} coins.",
				"messages.towerExists": "There is already a tower here.",
				"messages.towerLocked": "{tower} is unlocked in another biome.",
				"messages.towerNoTargets": "Tower cannot reach the path.",
				"messages.towerNotFound": "Tower not found.",
				"messages.towerRemoved": "{tower} removed.",
				"messages.towerSelected": "Selected tower: {tower}",
				"messages.towerUndone": "{tower} undone. +{refund} coins.",
				"messages.themeLostLives": "{theme} lost all lives.",
				"messages.pause": "Game paused.",
				"messages.resume": "Game resumed.",
				"messages.returnMenuError": "Error returning to menu.",
				"messages.removeThisTower": "Remove this tower?",
				"messages.saveFailed": "Could not save the game.",
				"messages.saveLoaded": "Saved game loaded.",
				"messages.waveCompleted": "Wave {wave} completed",
				"messages.waveStarted": "Wave {wave} started.",
				"pause.saveExit": "Save and exit",
				"pause.saveUnavailable": "Saving is not available in this Godot port yet.",
				"pause.title": "Paused",
				"settings.cards": "Cards",
				"settings.cardFrequencyMany": "{count} waves",
				"settings.cardFrequencyOff": "Off",
				"settings.cardFrequencyOne": "1 wave",
				"settings.frequency": "Freq.",
				"settings.language": "Language",
				"settings.sound": "Sound",
				"shop.attackShort": "ATK {attack}",
				"shop.delete": "Delete",
				"shop.rangeShort": "RNG {range}",
				"shop.restart": "Restart",
				"shop.select": "Select",
				"shop.undo": "Undo",
				"sound.off": "Off",
				"sound.on": "On",
				"towers.flame": "Flame",
				"towers.sentinel": "Sentinel",
				"towers.slow": "Chill",
				"towers.splash": "Cannon",
				"themes.lagoon": "Lagoon",
				"themes.lava": "Fire",
				"themes.park": "Park",
				"version.label": "Version {version}",
				"victory.default": "Victory!",
				"victory.gameOver": "Game over",
				"victory.lagoon": "Lagoon Protected!",
				"victory.lava": "Congratulations, you protected every biome!",
				"victory.park": "Park Protected!",
				"victory.restart": "Play again!",
				"victory.summary": "All waves were completed.",
				"messages.openGameplayError": "Error opening gameplay."
			}
		"es":
			return {
				"actions.pause": "Pausa",
				"actions.resume": "Retomar",
				"common.back": "Volver",
				"common.cancel": "Cancelar",
				"common.continue": "Continuar",
				"common.menu": "Menu",
				"common.remove": "Quitar",
				"common.start": "Iniciar",
				"cards.cardIndex": "Carta {index}",
				"cards.choose": "Elige una carta",
				"cards.defaultKind": "Carta",
				"cards.coinsAll.description": "Pierde todas las monedas ahora.",
				"cards.coinsAll.result": "Perdiste todas las monedas.",
				"cards.coinsAll.title": "Confiscacion total",
				"cards.coinsGain.description": "Gana {amount} monedas ahora.",
				"cards.coinsGain.result": "Ganaste {amount} monedas.",
				"cards.coinsGain.title": "Recolecta premiada",
				"cards.coinsLoss.description": "Pierde hasta {amount} monedas ahora.",
				"cards.coinsLoss.result": "Perdiste {amount} monedas.",
				"cards.coinsLoss.title": "Peaje de limpieza",
				"cards.damage.description": "{tower}: +30% dano permanente, max. {max}.",
				"cards.damage.result": "{tower} gano dano permanente hasta {max}.",
				"cards.damage.title": "{tower} reforzada",
				"cards.damageSetback.description": "{tower}: -23% dano permanente.",
				"cards.damageSetback.result": "{tower} perdio 23% de dano permanente.",
				"cards.damageSetback.title": "{tower} desregulada",
				"cards.enemyHp.description": "Enemigos: +18% HP en la proxima oleada.",
				"cards.enemyHp.result": "Los enemigos tendran +18% HP en la proxima oleada.",
				"cards.enemyHp.title": "Basura reforzada",
				"cards.enemySpeed.description": "Enemigos: +15% velocidad en la proxima oleada.",
				"cards.enemySpeed.result": "Los enemigos tendran +15% velocidad en la proxima oleada.",
				"cards.enemySpeed.title": "Carrera toxica",
				"cards.heal.description": "Recupera 1 HP ahora.",
				"cards.heal.full": "La vida ya estaba llena. Nada cambio.",
				"cards.heal.result": "Recuperaste 1 HP.",
				"cards.heal.title": "Aliento extra",
				"cards.kicker": "Elige una carta",
				"cards.kind.bane": "Reves",
				"cards.kind.boon": "Bono",
				"cards.kind.bonus": "Bono",
				"cards.kind.improvement": "Mejora",
				"cards.kind.neutral": "Neutro",
				"cards.kind.setback": "Reves",
				"cards.neutral.description": "La proxima oleada sigue normal.",
				"cards.neutral.result": "Nada sucede. La proxima oleada viene a ritmo normal.",
				"cards.neutral.title": "Nada cambio",
				"cards.noCoinsChanged": "Sin monedas para alterar. Nada cambio.",
				"cards.noCoinsLost": "Sin monedas para perder. Nada cambio.",
				"cards.powerSurge.description": "Una torre {tower}: dano duplicado en la proxima oleada.",
				"cards.powerSurge.result": "Una torre {tower} tendra dano duplicado en la proxima oleada.",
				"cards.powerSurge.title": "Pico de poder {tower}",
				"cards.range.description": "{tower}: +25% alcance permanente.",
				"cards.range.result": "{tower} gano +25% de alcance permanente.",
				"cards.range.title": "{tower} ampliada",
				"cards.rangeSetback.description": "{tower}: -20% alcance permanente.",
				"cards.rangeSetback.result": "{tower} perdio 20% de alcance permanente.",
				"cards.rangeSetback.title": "{tower} sobrecargada",
				"cards.towerTypeClear.description": "Quita todas las torres {tower} del tablero.",
				"cards.towerTypeClear.none": "No hay torres {tower} para quitar.",
				"cards.towerTypeClear.result": "Se quitaron {count} torres {tower}.",
				"cards.towerTypeClear.title": "Barrido de {tower}",
				"confirm.towerDeleteSummary": "La torre se quitara sin reembolso.",
				"confirm.towerDeleteTitle": "Quitar esta torre?",
				"controls.controller": "Control",
				"difficulty.custom": "Custom",
				"difficulty.easy": "Facil",
				"difficulty.hard": "Dificil",
				"difficulty.medium": "Medio",
				"difficulty.title": "Dificultad",
				"difficulty.waves": "Oleadas",
				"hud.defeated": "Derroto {count}",
				"hud.defeatedLabel": "Derroto",
				"hud.lives": "Vidas {count}",
				"hud.time": "Tiempo {time}",
				"hud.timeLabel": "Tiempo",
				"hud.wave": "Oleada",
				"hud.waveProgress": "Oleada {wave}/{limit}",
				"menu.config": "Config.",
				"menu.continue": "Continuar",
				"menu.demoReady": "Demo lista en Godot.",
				"menu.exit": "Salir",
				"menu.play": "Jugar",
				"messages.allWavesDone": "Todas las oleadas fueron completadas.",
				"messages.buildModeRestored": "Modo de construccion retomado.",
				"messages.cancelDeleteToBuild": "Cancela Borrar para construir.",
				"messages.gameEnded": "Partida terminada.",
				"messages.nextWaveSoon": "Oleada {wave} completada. Proxima oleada pronto.",
				"messages.noSavedGame": "No hay partida guardada.",
				"messages.notEnoughCoins": "Monedas insuficientes.",
				"messages.nothingToUndo": "Nada para deshacer.",
				"messages.parkLostLives": "El parque perdio todas las vidas.",
				"messages.prepareWave": "Preparando oleada {wave}.",
				"messages.resumeToBuild": "Retoma el juego para construir.",
				"messages.selectTower": "Selecciona una torre.",
				"messages.selectTowerToRemove": "Selecciona una torre para quitar.",
				"messages.spaceBlocked": "Espacio bloqueado.",
				"messages.spaceUnavailable": "Espacio no disponible.",
				"messages.speedFast": "Velocidad 2x.",
				"messages.speedNormal": "Velocidad 1x.",
				"messages.towerCreated": "{tower} creada por {cost} monedas.",
				"messages.towerExists": "Ya existe una torre aqui.",
				"messages.towerLocked": "{tower} se desbloquea en otro bioma.",
				"messages.towerNoTargets": "La torre no alcanza el camino.",
				"messages.towerNotFound": "Torre no encontrada.",
				"messages.towerRemoved": "{tower} quitada.",
				"messages.towerSelected": "Torre seleccionada: {tower}",
				"messages.towerUndone": "{tower} deshecha. +{refund} monedas.",
				"messages.themeLostLives": "{theme} perdio todas las vidas.",
				"messages.pause": "Juego pausado.",
				"messages.resume": "Juego retomado.",
				"messages.returnMenuError": "Error al volver al menu.",
				"messages.removeThisTower": "Quitar esta torre?",
				"messages.saveFailed": "No se pudo guardar la partida.",
				"messages.saveLoaded": "Partida guardada cargada.",
				"messages.waveCompleted": "Oleada {wave} completada",
				"messages.waveStarted": "Oleada {wave} iniciada.",
				"pause.saveExit": "Guardar y salir",
				"pause.saveUnavailable": "Guardar aun no esta disponible en este port de Godot.",
				"pause.title": "Pausado",
				"settings.cards": "Cartas",
				"settings.cardFrequencyMany": "{count} oleadas",
				"settings.cardFrequencyOff": "Off",
				"settings.cardFrequencyOne": "1 oleada",
				"settings.frequency": "Frec.",
				"settings.language": "Idioma",
				"settings.sound": "Sonido",
				"shop.attackShort": "ATQ {attack}",
				"shop.delete": "Borrar",
				"shop.rangeShort": "ALC {range}",
				"shop.restart": "Reiniciar",
				"shop.select": "Seleccionar",
				"shop.undo": "Deshacer",
				"sound.off": "Des",
				"sound.on": "Act",
				"towers.flame": "Llama",
				"towers.sentinel": "Centinela",
				"towers.slow": "Gelida",
				"towers.splash": "Canon",
				"themes.lagoon": "Laguna",
				"themes.lava": "Fuego",
				"themes.park": "Parque",
				"version.label": "Version {version}",
				"victory.default": "Victoria!",
				"victory.gameOver": "Fin del juego",
				"victory.lagoon": "Laguna protegida!",
				"victory.lava": "Felicitaciones, protegiste todos los biomas!",
				"victory.park": "Parque protegido!",
				"victory.restart": "Jugar otra vez!",
				"victory.summary": "Todas las oleadas fueron completadas.",
				"messages.openGameplayError": "Error al abrir gameplay."
			}
		_:
			return {
				"actions.pause": "Pause",
				"actions.resume": "Retomar",
				"common.back": "Voltar",
				"common.cancel": "Cancelar",
				"common.continue": "Continuar",
				"common.menu": "Menu",
				"common.remove": "Remover",
				"common.start": "Iniciar",
				"cards.cardIndex": "Carta {index}",
				"cards.choose": "Escolha uma carta",
				"cards.defaultKind": "Carta",
				"cards.coinsAll.description": "Perca todas as moedas agora.",
				"cards.coinsAll.result": "Voce perdeu todas as moedas.",
				"cards.coinsAll.title": "Confisco total",
				"cards.coinsGain.description": "Ganhe {amount} moedas agora.",
				"cards.coinsGain.result": "Voce ganhou {amount} moedas.",
				"cards.coinsGain.title": "Coleta premiada",
				"cards.coinsLoss.description": "Perca ate {amount} moedas agora.",
				"cards.coinsLoss.result": "Voce perdeu {amount} moedas.",
				"cards.coinsLoss.title": "Pedagio de limpeza",
				"cards.damage.description": "{tower}: +30% dano permanente, max. {max}.",
				"cards.damage.result": "{tower} ganhou dano permanente ate {max}.",
				"cards.damage.title": "{tower} reforcada",
				"cards.damageSetback.description": "{tower}: -23% dano permanente.",
				"cards.damageSetback.result": "{tower} perdeu 23% de dano permanente.",
				"cards.damageSetback.title": "{tower} desregulada",
				"cards.enemyHp.description": "Inimigos: +18% HP na proxima onda.",
				"cards.enemyHp.result": "Inimigos terao +18% HP na proxima onda.",
				"cards.enemyHp.title": "Lixo reforcado",
				"cards.enemySpeed.description": "Inimigos: +15% velocidade na proxima onda.",
				"cards.enemySpeed.result": "Inimigos terao +15% de velocidade na proxima onda.",
				"cards.enemySpeed.title": "Correria toxica",
				"cards.heal.description": "Recupere 1 HP agora.",
				"cards.heal.full": "Vida ja estava cheia. Nada mudou.",
				"cards.heal.result": "Voce recuperou 1 HP.",
				"cards.heal.title": "Folego extra",
				"cards.kicker": "Escolha uma carta",
				"cards.kind.bane": "Reves",
				"cards.kind.boon": "Bonus",
				"cards.kind.bonus": "Bonus",
				"cards.kind.improvement": "Melhoria",
				"cards.kind.neutral": "Neutro",
				"cards.kind.setback": "Reves",
				"cards.neutral.description": "A proxima onda segue normal.",
				"cards.neutral.result": "Nada acontece. A proxima onda vem no ritmo normal.",
				"cards.neutral.title": "Nada mudou",
				"cards.noCoinsChanged": "Sem moedas para alterar. Nada mudou.",
				"cards.noCoinsLost": "Sem moedas para perder. Nada mudou.",
				"cards.powerSurge.description": "Uma torre {tower}: dano dobrado na proxima onda.",
				"cards.powerSurge.result": "Uma torre {tower} tera dano dobrado na proxima onda.",
				"cards.powerSurge.title": "Pico de poder {tower}",
				"cards.range.description": "{tower}: +25% raio permanente.",
				"cards.range.result": "{tower} ganhou +25% de raio permanente.",
				"cards.range.title": "{tower} ampliada",
				"cards.rangeSetback.description": "{tower}: -20% raio permanente.",
				"cards.rangeSetback.result": "{tower} perdeu 20% de raio permanente.",
				"cards.rangeSetback.title": "{tower} sobrecarregada",
				"cards.towerTypeClear.description": "Remova todas as torres {tower} do tabuleiro.",
				"cards.towerTypeClear.none": "Nenhuma torre {tower} para remover.",
				"cards.towerTypeClear.result": "Foram removidas {count} torres {tower}.",
				"cards.towerTypeClear.title": "Varredura de {tower}",
				"confirm.towerDeleteSummary": "A torre sera removida sem reembolso.",
				"confirm.towerDeleteTitle": "Remover esta torre?",
				"controls.controller": "Controle",
				"difficulty.custom": "Custom",
				"difficulty.easy": "Facil",
				"difficulty.hard": "Dificil",
				"difficulty.medium": "Medio",
				"difficulty.title": "Dificuldade",
				"difficulty.waves": "Ondas",
				"hud.defeated": "Derrotou {count}",
				"hud.defeatedLabel": "Derrotou",
				"hud.lives": "Vidas {count}",
				"hud.time": "Tempo {time}",
				"hud.timeLabel": "Tempo",
				"hud.wave": "Onda",
				"hud.waveProgress": "Onda {wave}/{limit}",
				"menu.config": "Config.",
				"menu.continue": "Continuar",
				"menu.demoReady": "Demo pronta no Godot.",
				"menu.exit": "Sair",
				"menu.play": "Jogar",
				"messages.allWavesDone": "Todas as ondas foram concluidas.",
				"messages.buildModeRestored": "Modo construir restaurado.",
				"messages.cancelDeleteToBuild": "Cancele Excluir para construir.",
				"messages.gameEnded": "Partida encerrada.",
				"messages.nextWaveSoon": "Onda {wave} concluida. Proxima onda em breve.",
				"messages.noSavedGame": "Nenhum save encontrado.",
				"messages.notEnoughCoins": "Moedas insuficientes.",
				"messages.nothingToUndo": "Nada para desfazer.",
				"messages.parkLostLives": "O parque perdeu todas as vidas.",
				"messages.prepareWave": "Preparando onda {wave}.",
				"messages.resumeToBuild": "Retome o jogo para construir.",
				"messages.selectTower": "Selecione uma torre.",
				"messages.selectTowerToRemove": "Selecione uma torre para remover.",
				"messages.spaceBlocked": "Espaco bloqueado.",
				"messages.spaceUnavailable": "Espaco indisponivel.",
				"messages.speedFast": "Velocidade 2x.",
				"messages.speedNormal": "Velocidade 1x.",
				"messages.towerCreated": "{tower} criada por {cost} moedas.",
				"messages.towerExists": "Ja existe uma torre aqui.",
				"messages.towerLocked": "{tower} desbloqueia em outro bioma.",
				"messages.towerNoTargets": "Torre nao alcanca o caminho.",
				"messages.towerNotFound": "Torre nao encontrada.",
				"messages.towerRemoved": "{tower} removida.",
				"messages.towerSelected": "Torre selecionada: {tower}",
				"messages.towerUndone": "{tower} desfeita. +{refund} moedas.",
				"messages.themeLostLives": "{theme} perdeu todas as vidas.",
				"messages.pause": "Jogo pausado.",
				"messages.resume": "Jogo retomado.",
				"messages.returnMenuError": "Erro ao voltar ao menu.",
				"messages.removeThisTower": "Remover esta torre?",
				"messages.saveFailed": "Nao foi possivel salvar o jogo.",
				"messages.saveLoaded": "Save carregado.",
				"messages.waveCompleted": "Onda {wave} concluida",
				"messages.waveStarted": "Onda {wave} iniciada.",
				"pause.saveExit": "Salvar e sair",
				"pause.saveUnavailable": "Salvar ainda nao esta disponivel neste port Godot.",
				"pause.title": "Pausado",
				"settings.cards": "Cartas",
				"settings.cardFrequencyMany": "{count} ondas",
				"settings.cardFrequencyOff": "Off",
				"settings.cardFrequencyOne": "1 onda",
				"settings.frequency": "Freq.",
				"settings.language": "Idioma",
				"settings.sound": "Som",
				"shop.attackShort": "ATQ {attack}",
				"shop.delete": "Excluir",
				"shop.rangeShort": "ALC {range}",
				"shop.restart": "Reiniciar",
				"shop.select": "Selecionar",
				"shop.undo": "Desfazer",
				"sound.off": "Des",
				"sound.on": "Lig",
				"towers.flame": "Chama",
				"towers.sentinel": "Sentinela",
				"towers.slow": "Gelida",
				"towers.splash": "Canhao",
				"themes.lagoon": "Lagoa",
				"themes.lava": "Fogo",
				"themes.park": "Parque",
				"version.label": "Versao {version}",
				"victory.default": "Parque Protegido!",
				"victory.gameOver": "Fim de jogo",
				"victory.lagoon": "Lagoa Protegida!",
				"victory.lava": "Parabens voce protegeu todos os biomas",
				"victory.park": "Parque Protegido!",
				"victory.restart": "Jogar novamente!",
				"victory.summary": "Todas as ondas foram concluidas.",
				"messages.openGameplayError": "Erro ao abrir gameplay."
			}
