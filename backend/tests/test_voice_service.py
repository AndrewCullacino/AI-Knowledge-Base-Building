"""Tests for voice service functionality."""

import os
import tempfile
from pathlib import Path

import pytest
from agent.voice_service import (
    convert_audio_to_wav,
    transcribe_audio,
    SUPPORTED_FORMATS,
)


@pytest.fixture
def temp_audio_file():
    """Create a temporary audio file for testing."""
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
        # Create a minimal valid WAV file (silence)
        # WAV header for a minimal valid file
        wav_header = bytes([
            0x52, 0x49, 0x46, 0x46,  # "RIFF"
            0x24, 0x00, 0x00, 0x00,  # File size - 8
            0x57, 0x41, 0x56, 0x45,  # "WAVE"
            0x66, 0x6D, 0x74, 0x20,  # "fmt "
            0x10, 0x00, 0x00, 0x00,  # Subchunk size
            0x01, 0x00,              # Audio format (PCM)
            0x01, 0x00,              # Number of channels (mono)
            0x80, 0x3E, 0x00, 0x00,  # Sample rate (16000)
            0x00, 0x7D, 0x00, 0x00,  # Byte rate
            0x02, 0x00,              # Block align
            0x10, 0x00,              # Bits per sample
            0x64, 0x61, 0x74, 0x61,  # "data"
            0x00, 0x00, 0x00, 0x00,  # Data size
        ])
        temp_file.write(wav_header)
        temp_file.flush()

        yield temp_file.name

    # Cleanup
    if os.path.exists(temp_file.name):
        os.remove(temp_file.name)


def test_supported_formats():
    """Test that all expected formats are supported."""
    expected_formats = {".webm", ".mp3", ".wav", ".m4a", ".ogg", ".flac"}
    assert SUPPORTED_FORMATS == expected_formats


def test_transcribe_audio_file_not_found():
    """Test transcription with non-existent file."""
    with pytest.raises(FileNotFoundError):
        transcribe_audio("/path/to/nonexistent/file.wav")


def test_transcribe_audio_unsupported_format():
    """Test transcription with unsupported file format."""
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as temp_file:
        temp_path = temp_file.name

    try:
        with pytest.raises(ValueError, match="Unsupported audio format"):
            transcribe_audio(temp_path)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def test_convert_audio_unsupported_format():
    """Test audio conversion with unsupported format."""
    input_path = Path("/tmp/test.xyz")
    output_path = Path("/tmp/test.wav")

    with pytest.raises(ValueError, match="Unsupported audio format"):
        convert_audio_to_wav(input_path, output_path)


def test_transcribe_audio_with_valid_file(temp_audio_file):
    """Test transcription with a valid audio file.

    Note: This test may fail if Whisper is not installed or model not available.
    It's designed to verify the function signature and basic error handling.
    """
    try:
        # This will likely return empty string for silence
        result = transcribe_audio(temp_audio_file)
        assert isinstance(result, str)
    except RuntimeError as e:
        # Whisper model may not be available in test environment
        pytest.skip(f"Whisper model not available: {e}")


def test_transcription_response_structure():
    """Test the expected structure of transcription responses."""
    # This tests the API contract
    from agent.app import TranscriptionResponse

    response = TranscriptionResponse(
        text="Test transcription",
        success=True,
        error=None
    )

    assert response.text == "Test transcription"
    assert response.success is True
    assert response.error is None


def test_transcription_error_response():
    """Test error response structure."""
    from agent.app import TranscriptionResponse

    response = TranscriptionResponse(
        text="",
        success=False,
        error="Transcription failed"
    )

    assert response.text == ""
    assert response.success is False
    assert response.error == "Transcription failed"
