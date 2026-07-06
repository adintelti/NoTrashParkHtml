extends Node

const BGM_BUS: StringName = &"BGM"
const SFX_BUS: StringName = &"SFX"
const MUSIC_VOLUME: float = 0.42
const DEFAULT_SFX_VOLUME: float = 0.58
const SFX_POOL_SIZE: int = 5
const FADE_OUT_SECONDS: float = 0.65
const FADE_IN_SECONDS: float = 0.90
const MENU_FADE_IN_SECONDS: float = 0.22

const MUSIC_MENU: AudioStream = preload("res://assets/audio/bgm/menu.mp3")
const MUSIC_PARK: AudioStream = preload("res://assets/audio/bgm/level1-park.mp3")
const MUSIC_LAGOON: AudioStream = preload("res://assets/audio/bgm/level2-water.mp3")
const MUSIC_LAVA: AudioStream = preload("res://assets/audio/bgm/level3-fire.mp3")
const SFX_PROJECTILE_THROW: AudioStream = preload("res://assets/audio/sfx/tap_stone.mp3")
const SFX_ENEMY_DEATH: AudioStream = preload("res://assets/audio/sfx/tail_whip.mp3")

var _bgm_player: AudioStreamPlayer
var _sfx_players: Array[AudioStreamPlayer] = []
var _sfx_next_index: int = 0
var _active_track: String = ""
var _desired_track: String = "menu"
var _transition_id: int = 0
var _fade_tween: Tween
var _last_sfx_played_at: Dictionary = {}

func _ready() -> void:
	_ensure_audio_buses()
	_configure_music_loops()
	_create_players()
	apply_sound_settings()
	play_menu_music()

func play_menu_music() -> void:
	play_music("menu")

func play_theme_music(theme: String) -> void:
	play_music(theme)

func play_music(track: String) -> void:
	var normalized_track: String = _normalize_music_track(track)
	var music_stream: AudioStream = _get_music_stream(normalized_track)
	if music_stream == null:
		return

	_desired_track = normalized_track
	if not GameSession.bgm_enabled or GameSession.bgm_volume <= 0.0:
		stop_music()
		return

	_transition_id += 1
	var transition_token: int = _transition_id

	if _active_track == normalized_track and _bgm_player.stream == music_stream:
		if not _bgm_player.playing:
			_bgm_player.play()
		_fade_music_to(MUSIC_VOLUME, _get_fade_in_seconds(normalized_track), transition_token)
		return

	_transition_to_music(normalized_track, music_stream, transition_token)

func stop_music() -> void:
	_transition_id += 1
	if _fade_tween != null and _fade_tween.is_valid():
		_fade_tween.kill()
	_bgm_player.stop()
	_bgm_player.volume_linear = 0.0
	_active_track = ""

func play_sfx(sfx_key: String) -> void:
	if not GameSession.sfx_enabled or GameSession.sfx_volume <= 0.0:
		return
	if not _can_play_sfx_now(sfx_key):
		return

	var sfx_stream: AudioStream = _get_sfx_stream(sfx_key)
	if sfx_stream == null:
		return

	var player: AudioStreamPlayer = _get_next_sfx_player()
	player.stream = sfx_stream
	player.volume_linear = _get_sfx_base_volume(sfx_key)
	player.set_meta("sfx_key", sfx_key)
	player.stop()
	player.play()

func set_bgm_enabled(enabled: bool) -> void:
	GameSession.set_bgm_enabled(enabled)
	apply_sound_settings()
	if GameSession.bgm_enabled:
		play_music(_desired_track)
	else:
		stop_music()

func set_sfx_enabled(enabled: bool) -> void:
	GameSession.set_sfx_enabled(enabled)
	apply_sound_settings()

func set_bgm_volume(volume: float) -> void:
	GameSession.set_bgm_volume(volume)
	apply_sound_settings()
	if GameSession.bgm_enabled and GameSession.bgm_volume > 0.0:
		play_music(_desired_track)
	else:
		stop_music()

func set_sfx_volume(volume: float) -> void:
	GameSession.set_sfx_volume(volume)
	apply_sound_settings()

func apply_sound_settings() -> void:
	_ensure_audio_buses()
	var bgm_index: int = AudioServer.get_bus_index(BGM_BUS)
	if bgm_index >= 0:
		AudioServer.set_bus_mute(bgm_index, not GameSession.bgm_enabled)
		AudioServer.set_bus_volume_linear(bgm_index, clampf(GameSession.bgm_volume, 0.0, 1.0))

	var sfx_index: int = AudioServer.get_bus_index(SFX_BUS)
	if sfx_index >= 0:
		AudioServer.set_bus_mute(sfx_index, not GameSession.sfx_enabled)
		AudioServer.set_bus_volume_linear(sfx_index, clampf(GameSession.sfx_volume, 0.0, 1.0))

func _transition_to_music(track: String, music_stream: AudioStream, transition_token: int) -> void:
	if _bgm_player.playing:
		await _fade_music_to(0.0, FADE_OUT_SECONDS, transition_token)
		if transition_token != _transition_id:
			return
		_bgm_player.stop()

	_active_track = track
	_bgm_player.stream = music_stream
	_bgm_player.volume_linear = 0.0
	_bgm_player.play()
	await _fade_music_to(MUSIC_VOLUME, _get_fade_in_seconds(track), transition_token)

func _fade_music_to(target_volume: float, duration: float, transition_token: int) -> void:
	if _fade_tween != null and _fade_tween.is_valid():
		_fade_tween.kill()
	if transition_token != _transition_id:
		return

	_fade_tween = create_tween()
	_fade_tween.set_trans(Tween.TRANS_SINE)
	_fade_tween.set_ease(Tween.EASE_IN_OUT)
	_fade_tween.tween_property(_bgm_player, "volume_linear", target_volume, duration)
	await _fade_tween.finished

func _ensure_audio_buses() -> void:
	_ensure_audio_bus(BGM_BUS)
	_ensure_audio_bus(SFX_BUS)

func _ensure_audio_bus(bus_name: StringName) -> void:
	if AudioServer.get_bus_index(bus_name) >= 0:
		return

	AudioServer.add_bus()
	var bus_index: int = AudioServer.bus_count - 1
	AudioServer.set_bus_name(bus_index, String(bus_name))
	AudioServer.set_bus_send(bus_index, &"Master")

func _create_players() -> void:
	if _bgm_player == null:
		_bgm_player = AudioStreamPlayer.new()
		_bgm_player.name = "BgmPlayer"
		_bgm_player.bus = BGM_BUS
		add_child(_bgm_player)

	if not _sfx_players.is_empty():
		return

	for player_index in range(SFX_POOL_SIZE):
		var player: AudioStreamPlayer = AudioStreamPlayer.new()
		player.name = "SfxPlayer_%02d" % player_index
		player.bus = SFX_BUS
		add_child(player)
		_sfx_players.append(player)

func _configure_music_loops() -> void:
	_set_stream_loop(MUSIC_MENU)
	_set_stream_loop(MUSIC_PARK)
	_set_stream_loop(MUSIC_LAGOON)
	_set_stream_loop(MUSIC_LAVA)

func _set_stream_loop(stream: AudioStream) -> void:
	var mp3_stream: AudioStreamMP3 = stream as AudioStreamMP3
	if mp3_stream == null:
		return
	mp3_stream.loop = true

func _get_next_sfx_player() -> AudioStreamPlayer:
	var player: AudioStreamPlayer = _sfx_players[_sfx_next_index]
	_sfx_next_index = (_sfx_next_index + 1) % _sfx_players.size()
	return player

func _can_play_sfx_now(sfx_key: String) -> bool:
	var current_time_ms: int = Time.get_ticks_msec()
	var last_played_ms: int = int(_last_sfx_played_at.get(sfx_key, -1000000))
	if current_time_ms - last_played_ms < _get_sfx_min_interval_ms(sfx_key):
		return false

	if _get_active_sfx_count(sfx_key) >= _get_sfx_max_overlap(sfx_key):
		return false

	_last_sfx_played_at[sfx_key] = current_time_ms
	return true

func _get_active_sfx_count(sfx_key: String) -> int:
	var active_count: int = 0
	for player in _sfx_players:
		if not player.playing:
			continue
		var player_sfx_key: String = str(player.get_meta("sfx_key", ""))
		if player_sfx_key == sfx_key:
			active_count += 1
	return active_count

func _get_music_stream(track: String) -> AudioStream:
	match track:
		"menu":
			return MUSIC_MENU
		"park":
			return MUSIC_PARK
		"lagoon":
			return MUSIC_LAGOON
		"lava":
			return MUSIC_LAVA
		_:
			return null

func _get_sfx_stream(sfx_key: String) -> AudioStream:
	match sfx_key:
		"projectileThrow":
			return SFX_PROJECTILE_THROW
		"enemyDeath":
			return SFX_ENEMY_DEATH
		_:
			return null

func _get_sfx_base_volume(sfx_key: String) -> float:
	match sfx_key:
		"projectileThrow":
			return 0.05
		"enemyDeath":
			return 1.0
		_:
			return DEFAULT_SFX_VOLUME

func _get_sfx_min_interval_ms(sfx_key: String) -> int:
	match sfx_key:
		"projectileThrow":
			return 45
		"enemyDeath":
			return 70
		_:
			return 0

func _get_sfx_max_overlap(sfx_key: String) -> int:
	match sfx_key:
		"projectileThrow":
			return 4
		"enemyDeath":
			return 3
		_:
			return 4

func _get_fade_in_seconds(track: String) -> float:
	if track == "menu":
		return MENU_FADE_IN_SECONDS
	return FADE_IN_SECONDS

func _normalize_music_track(track: String) -> String:
	if track == "park" or track == "lagoon" or track == "lava":
		return track
	return "menu"
