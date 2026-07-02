extends Node

const DEFAULT_DIFFICULTY: String = "medium"
const DEFAULT_WAVE_LIMIT: int = 12
const DEFAULT_CUSTOM_WAVES: int = 20
const DEFAULT_CARD_FREQUENCY: int = 3
const DEFAULT_CONTROLLER_LAYOUT: String = "xbox"
const DEFAULT_LANGUAGE: String = "pt-BR"

var difficulty: String = DEFAULT_DIFFICULTY
var wave_limit: int = DEFAULT_WAVE_LIMIT
var custom_waves: int = DEFAULT_CUSTOM_WAVES
var card_frequency: int = DEFAULT_CARD_FREQUENCY
var controller_layout: String = DEFAULT_CONTROLLER_LAYOUT
var language: String = DEFAULT_LANGUAGE
var bgm_enabled: bool = true
var sfx_enabled: bool = true

func reset() -> void:
	difficulty = DEFAULT_DIFFICULTY
	wave_limit = DEFAULT_WAVE_LIMIT
	custom_waves = DEFAULT_CUSTOM_WAVES
	card_frequency = DEFAULT_CARD_FREQUENCY
	controller_layout = DEFAULT_CONTROLLER_LAYOUT
	language = DEFAULT_LANGUAGE
	bgm_enabled = true
	sfx_enabled = true
