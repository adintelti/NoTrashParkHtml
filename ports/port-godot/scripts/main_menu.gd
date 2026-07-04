extends Control

const GAMEPLAY_SCENE: String = "res://scenes/gameplay.tscn"
const MIN_CUSTOM_WAVES: int = 20
const MAX_CUSTOM_WAVES: int = 99

var selected_difficulty: String = ""
var card_frequency: int = 3
var selected_controller_layout: String = "xbox"
var selected_language: String = "pt-BR"
var bgm_enabled: bool = true
var sfx_enabled: bool = true
var bgm_volume: float = 1.0
var sfx_volume: float = 1.0

@onready var _config_panel: Control = get_node("AppBackground/GameFrame/ConfigPanel")
@onready var _difficulty_panel: Control = get_node("AppBackground/GameFrame/DifficultyPanel")
@onready var _menu_note: Control = get_node("AppBackground/GameFrame/MenuNote")
@onready var _menu_note_label: Label = get_node("AppBackground/GameFrame/MenuNote/MenuNoteLabel")
@onready var _menu_note_timer: Timer = get_node("MenuNoteTimer")
@onready var _version_label: Label = get_node("AppBackground/GameFrame/VersionPanel/VersionLabel")
@onready var _continue_button: Button = get_node("AppBackground/GameFrame/MenuButtons/ContinueButton")
@onready var _play_button: Button = get_node("AppBackground/GameFrame/MenuButtons/PlayButton")
@onready var _config_button: Button = get_node("AppBackground/GameFrame/MenuButtons/ConfigButton")
@onready var _exit_button: Button = get_node("AppBackground/GameFrame/MenuButtons/ExitButton")
@onready var _difficulty_title: Label = get_node("AppBackground/GameFrame/DifficultyPanel/DifficultyContent/DifficultyTitle")
@onready var _difficulty_back_button: Button = get_node("AppBackground/GameFrame/DifficultyPanel/DifficultyContent/DifficultyActions/DifficultyBackButton")
@onready var _start_button: Button = get_node("AppBackground/GameFrame/DifficultyPanel/DifficultyContent/DifficultyActions/StartButton")
@onready var _waves_label: Label = get_node("AppBackground/GameFrame/DifficultyPanel/DifficultyContent/WavesRow/WavesLabel")
@onready var _waves_input: LineEdit = get_node("AppBackground/GameFrame/DifficultyPanel/DifficultyContent/WavesRow/WavesInput")
@onready var _config_back_button: Button = get_node("AppBackground/GameFrame/ConfigPanel/ConfigContent/ConfigBackButton")
@onready var _controller_title: Label = get_node("AppBackground/GameFrame/ConfigPanel/ConfigContent/ControllerSection/ControllerTitle")
@onready var _language_title: Label = get_node("AppBackground/GameFrame/ConfigPanel/ConfigContent/LanguageSection/LanguageTitle")
@onready var _card_title: Label = get_node("AppBackground/GameFrame/ConfigPanel/ConfigContent/CardSection/CardTitle")
@onready var _card_frequency_label: Label = get_node("AppBackground/GameFrame/ConfigPanel/ConfigContent/CardSection/CardFrequencyRow/CardFrequencyLabel")
@onready var _card_frequency_slider: HSlider = get_node("AppBackground/GameFrame/ConfigPanel/ConfigContent/CardSection/CardFrequencyRow/CardFrequencySlider")
@onready var _card_frequency_text: Label = get_node("AppBackground/GameFrame/ConfigPanel/ConfigContent/CardSection/CardFrequencyRow/CardFrequencyText")
@onready var _sound_title: Label = get_node("AppBackground/GameFrame/ConfigPanel/ConfigContent/SoundSection/SoundTitle")
@onready var _difficulty_buttons: Dictionary = {
	"easy": get_node("AppBackground/GameFrame/DifficultyPanel/DifficultyContent/DifficultyGrid/EasyButton"),
	"medium": get_node("AppBackground/GameFrame/DifficultyPanel/DifficultyContent/DifficultyGrid/MediumButton"),
	"hard": get_node("AppBackground/GameFrame/DifficultyPanel/DifficultyContent/DifficultyGrid/HardButton"),
	"custom": get_node("AppBackground/GameFrame/DifficultyPanel/DifficultyContent/DifficultyGrid/CustomButton")
}
@onready var _controller_buttons: Dictionary = {
	"xbox": get_node("AppBackground/GameFrame/ConfigPanel/ConfigContent/ControllerSection/ControllerButtons/XboxLayoutButton"),
	"switch": get_node("AppBackground/GameFrame/ConfigPanel/ConfigContent/ControllerSection/ControllerButtons/SwitchLayoutButton")
}
@onready var _language_buttons: Dictionary = {
	"pt-BR": get_node("AppBackground/GameFrame/ConfigPanel/ConfigContent/LanguageSection/LanguageButtons/PtLanguageButton"),
	"en": get_node("AppBackground/GameFrame/ConfigPanel/ConfigContent/LanguageSection/LanguageButtons/EnLanguageButton"),
	"es": get_node("AppBackground/GameFrame/ConfigPanel/ConfigContent/LanguageSection/LanguageButtons/EsLanguageButton")
}
@onready var _sound_buttons: Dictionary = {
	"bgm": get_node("AppBackground/GameFrame/ConfigPanel/ConfigContent/SoundSection/SoundToggleButtons/BgmToggleButton"),
	"sfx": get_node("AppBackground/GameFrame/ConfigPanel/ConfigContent/SoundSection/SoundToggleButtons/SfxToggleButton")
}
@onready var _volume_sliders: Dictionary = {
	"bgm": get_node("AppBackground/GameFrame/ConfigPanel/ConfigContent/SoundSection/BgmVolumeRow/BgmVolumeSlider"),
	"sfx": get_node("AppBackground/GameFrame/ConfigPanel/ConfigContent/SoundSection/SfxVolumeRow/SfxVolumeSlider")
}
@onready var _volume_labels: Dictionary = {
	"bgm": get_node("AppBackground/GameFrame/ConfigPanel/ConfigContent/SoundSection/BgmVolumeRow/BgmVolumeText"),
	"sfx": get_node("AppBackground/GameFrame/ConfigPanel/ConfigContent/SoundSection/SfxVolumeRow/SfxVolumeText")
}

func _ready() -> void:
	selected_language = GameSession.language
	bgm_enabled = GameSession.bgm_enabled
	sfx_enabled = GameSession.sfx_enabled
	bgm_volume = GameSession.bgm_volume
	sfx_volume = GameSession.sfx_volume
	GameSession.apply_language(selected_language, false)
	_difficulty_panel.hide()
	_config_panel.hide()
	_menu_note.hide()
	_start_button.disabled = true

	_play_button.pressed.connect(_open_difficulty_panel)
	_config_button.pressed.connect(_toggle_config_panel)
	_exit_button.pressed.connect(_quit_game)
	_difficulty_back_button.pressed.connect(_close_difficulty_panel)
	_config_back_button.pressed.connect(_close_config_panel)
	_start_button.pressed.connect(_start_selected_game)
	_waves_input.text_changed.connect(_sanitize_custom_waves)
	_waves_input.focus_exited.connect(_normalize_custom_waves)
	_card_frequency_slider.value_changed.connect(_set_card_frequency)
	_menu_note_timer.timeout.connect(_hide_menu_note)

	for difficulty in _difficulty_buttons:
		var button: Button = _difficulty_buttons[difficulty] as Button
		button.toggle_mode = true
		button.pressed.connect(_select_difficulty.bind(difficulty))

	for layout in _controller_buttons:
		var button: Button = _controller_buttons[layout] as Button
		button.toggle_mode = true
		button.pressed.connect(_select_controller_layout.bind(layout))

	for language in _language_buttons:
		var button: Button = _language_buttons[language] as Button
		button.toggle_mode = true
		button.pressed.connect(_select_language.bind(language))

	for sound_type in _sound_buttons:
		var button: Button = _sound_buttons[sound_type] as Button
		button.toggle_mode = true
		button.pressed.connect(_toggle_sound.bind(sound_type))

	for sound_type in _volume_sliders:
		var slider: HSlider = _volume_sliders[sound_type] as HSlider
		slider.value_changed.connect(_set_sound_volume.bind(sound_type))

	_set_card_frequency(card_frequency)
	_sync_volume_sliders()
	_sync_segment_buttons(_controller_buttons, selected_controller_layout)
	_sync_segment_buttons(_language_buttons, selected_language)
	_sync_sound_buttons()
	_sync_volume_labels()
	_apply_translations()
	AudioManager.play_menu_music()

func _open_difficulty_panel() -> void:
	selected_difficulty = ""
	_config_panel.hide()
	_difficulty_panel.show()
	_start_button.disabled = true
	_sync_difficulty_buttons()

func _close_difficulty_panel() -> void:
	_difficulty_panel.hide()
	_sync_difficulty_buttons()

func _toggle_config_panel() -> void:
	_difficulty_panel.hide()
	_config_panel.visible = not _config_panel.visible

func _close_config_panel() -> void:
	_config_panel.hide()

func _select_difficulty(difficulty: String) -> void:
	selected_difficulty = difficulty
	if difficulty == "custom" and _waves_input.text.strip_edges().is_empty():
		_waves_input.text = str(MIN_CUSTOM_WAVES)
	_start_button.disabled = false
	_sync_difficulty_buttons()

func _sync_difficulty_buttons() -> void:
	for difficulty in _difficulty_buttons:
		var button: Button = _difficulty_buttons[difficulty] as Button
		button.button_pressed = difficulty == selected_difficulty

func _sanitize_custom_waves(new_text: String) -> void:
	var digits: String = ""
	for index in range(new_text.length()):
		var character: String = new_text.substr(index, 1)
		var code: int = character.unicode_at(0)
		if code >= 48 and code <= 57:
			digits += character

	if digits != new_text:
		_waves_input.text = digits
		_waves_input.caret_column = digits.length()

	if not digits.is_empty():
		var capped_value: int = mini(MAX_CUSTOM_WAVES, int(digits))
		if str(capped_value) != digits:
			_waves_input.text = str(capped_value)
			_waves_input.caret_column = _waves_input.text.length()

	_select_difficulty("custom")

func _normalize_custom_waves() -> void:
	var wave_count: int = MIN_CUSTOM_WAVES
	if not _waves_input.text.strip_edges().is_empty():
		wave_count = clampi(int(_waves_input.text), MIN_CUSTOM_WAVES, MAX_CUSTOM_WAVES)
	_waves_input.text = str(wave_count)

func _set_card_frequency(value: float) -> void:
	card_frequency = int(value)
	_card_frequency_text.text = _format_card_frequency(card_frequency)

func _select_controller_layout(layout: String) -> void:
	selected_controller_layout = layout
	_sync_segment_buttons(_controller_buttons, selected_controller_layout)

func _select_language(language: String) -> void:
	selected_language = language
	GameSession.apply_language(selected_language)
	_sync_segment_buttons(_language_buttons, selected_language)
	_apply_translations()

func _toggle_sound(sound_type: String) -> void:
	if sound_type == "bgm":
		bgm_enabled = not bgm_enabled
		AudioManager.set_bgm_enabled(bgm_enabled)
	else:
		sfx_enabled = not sfx_enabled
		AudioManager.set_sfx_enabled(sfx_enabled)
	_sync_sound_buttons()

func _set_sound_volume(value: float, sound_type: String) -> void:
	var normalized_volume: float = clampf(value / 100.0, 0.0, 1.0)
	if sound_type == "bgm":
		bgm_volume = normalized_volume
		AudioManager.set_bgm_volume(bgm_volume)
	else:
		sfx_volume = normalized_volume
		AudioManager.set_sfx_volume(sfx_volume)

	var label: Label = _volume_labels[sound_type] as Label
	label.text = str(int(value)) + "%"

func _sync_segment_buttons(buttons: Dictionary, selected_value: String) -> void:
	for key in buttons:
		var button: Button = buttons[key] as Button
		button.button_pressed = key == selected_value

func _sync_sound_buttons() -> void:
	_sync_sound_button("bgm", bgm_enabled)
	_sync_sound_button("sfx", sfx_enabled)

func _sync_sound_button(sound_type: String, enabled: bool) -> void:
	var button: Button = _sound_buttons[sound_type] as Button
	var label: String = sound_type.to_upper()
	var state_text: String = GameSession.t("sound.on") if enabled else GameSession.t("sound.off")
	button.button_pressed = enabled
	button.text = label + " " + state_text

func _sync_volume_labels() -> void:
	for sound_type in _volume_sliders:
		var slider: HSlider = _volume_sliders[sound_type] as HSlider
		_set_sound_volume(slider.value, sound_type)

func _sync_volume_sliders() -> void:
	var bgm_slider: HSlider = _volume_sliders["bgm"] as HSlider
	var sfx_slider: HSlider = _volume_sliders["sfx"] as HSlider
	bgm_slider.set_value_no_signal(roundf(bgm_volume * 100.0))
	sfx_slider.set_value_no_signal(roundf(sfx_volume * 100.0))

func _format_card_frequency(value: int) -> String:
	if value <= 0:
		return GameSession.t("settings.cardFrequencyOff")
	if value == 1:
		return GameSession.t("settings.cardFrequencyOne")
	return GameSession.t("settings.cardFrequencyMany", {"count": value})

func _get_wave_limit() -> int:
	match selected_difficulty:
		"easy":
			return 5
		"medium":
			return 12
		"hard":
			return 20
		"custom":
			return int(_waves_input.text)
		_:
			return 12

func _start_selected_game() -> void:
	_normalize_custom_waves()
	GameSession.difficulty = selected_difficulty
	GameSession.wave_limit = _get_wave_limit()
	GameSession.custom_waves = int(_waves_input.text)
	GameSession.card_frequency = card_frequency
	GameSession.controller_layout = selected_controller_layout
	GameSession.set_theme(GameSession.get_first_theme())
	GameSession.apply_language(selected_language)
	GameSession.set_bgm_enabled(bgm_enabled)
	GameSession.set_sfx_enabled(sfx_enabled)
	GameSession.set_bgm_volume(bgm_volume)
	GameSession.set_sfx_volume(sfx_volume)

	var error: int = get_tree().change_scene_to_file(GAMEPLAY_SCENE)
	if error != OK:
		_show_menu_note(GameSession.t("messages.openGameplayError"))

func _quit_game() -> void:
	get_tree().quit(0)

func _show_menu_note(text: String) -> void:
	_menu_note_label.text = text
	_menu_note.show()
	_menu_note_timer.start()

func _hide_menu_note() -> void:
	_menu_note.hide()

func _apply_translations() -> void:
	_version_label.text = GameSession.t("version.label", {"version": "2.1.5"})
	_continue_button.text = GameSession.t("menu.continue")
	_play_button.text = GameSession.t("menu.play")
	_config_button.text = GameSession.t("menu.config")
	_exit_button.text = GameSession.t("menu.exit")
	_difficulty_title.text = GameSession.t("difficulty.title")
	_waves_label.text = GameSession.t("difficulty.waves")
	_difficulty_back_button.text = GameSession.t("common.back")
	_start_button.text = GameSession.t("common.start")
	_controller_title.text = GameSession.t("controls.controller")
	_language_title.text = GameSession.t("settings.language")
	_card_title.text = GameSession.t("settings.cards")
	_card_frequency_label.text = GameSession.t("settings.frequency")
	_sound_title.text = GameSession.t("settings.sound")
	_config_back_button.text = GameSession.t("common.back")
	_card_frequency_text.text = _format_card_frequency(card_frequency)
	_sync_difficulty_button_labels()
	_sync_sound_buttons()

func _sync_difficulty_button_labels() -> void:
	var easy_button: Button = _difficulty_buttons["easy"] as Button
	var medium_button: Button = _difficulty_buttons["medium"] as Button
	var hard_button: Button = _difficulty_buttons["hard"] as Button
	var custom_button: Button = _difficulty_buttons["custom"] as Button
	easy_button.text = "%s\n5" % GameSession.t("difficulty.easy")
	medium_button.text = "%s\n12" % GameSession.t("difficulty.medium")
	hard_button.text = "%s\n20" % GameSession.t("difficulty.hard")
	custom_button.text = "%s\n20-99" % GameSession.t("difficulty.custom")
