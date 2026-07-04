extends Node

const DEFAULT_DIFFICULTY: String = "medium"
const DEFAULT_WAVE_LIMIT: int = 12
const DEFAULT_CUSTOM_WAVES: int = 20
const DEFAULT_CARD_FREQUENCY: int = 3
const DEFAULT_CONTROLLER_LAYOUT: String = "xbox"
const DEFAULT_LANGUAGE: String = "pt-BR"
const DEFAULT_THEME: String = "park"
const SETTINGS_PATH: String = "user://settings.cfg"

var difficulty: String = DEFAULT_DIFFICULTY
var wave_limit: int = DEFAULT_WAVE_LIMIT
var custom_waves: int = DEFAULT_CUSTOM_WAVES
var card_frequency: int = DEFAULT_CARD_FREQUENCY
var controller_layout: String = DEFAULT_CONTROLLER_LAYOUT
var language: String = DEFAULT_LANGUAGE
var theme: String = DEFAULT_THEME
var bgm_enabled: bool = true
var sfx_enabled: bool = true

var _translations_registered: bool = false

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

func _save_settings() -> void:
	var config: ConfigFile = ConfigFile.new()
	config.set_value("settings", "language", language)
	config.save(SETTINGS_PATH)

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
				"messages.waveCompleted": "Wave {wave} completed",
				"messages.waveStarted": "Wave {wave} started.",
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
				"messages.waveCompleted": "Oleada {wave} completada",
				"messages.waveStarted": "Oleada {wave} iniciada.",
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
				"messages.waveCompleted": "Onda {wave} concluida",
				"messages.waveStarted": "Onda {wave} iniciada.",
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
