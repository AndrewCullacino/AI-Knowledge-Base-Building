"""Voice service for speech-to-text transcription using OpenAI Whisper.

This module provides functionality for transcribing audio files using the
Whisper model running locally (not the OpenAI API).
"""

import logging
import os
import tempfile
from pathlib import Path
from typing import Optional

import whisper
from pydub import AudioSegment

# Configure logging
logger = logging.getLogger(__name__)

# Supported audio formats
SUPPORTED_FORMATS = {".webm", ".mp3", ".wav", ".m4a", ".ogg", ".flac"}

# Whisper model configuration
WHISPER_MODEL = "base"  # Good balance between speed and accuracy
whisper_model: Optional[whisper.Whisper] = None


def load_whisper_model() -> whisper.Whisper:
    """Load the Whisper model with lazy initialization.

    Returns:
        whisper.Whisper: The loaded Whisper model instance.

    Raises:
        RuntimeError: If model loading fails.
    """
    global whisper_model
    if whisper_model is None:
        try:
            logger.info(f"Loading Whisper model: {WHISPER_MODEL}")
            whisper_model = whisper.load_model(WHISPER_MODEL)
            logger.info("Whisper model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            raise RuntimeError(f"Failed to load Whisper model: {e}")
    return whisper_model


def convert_audio_to_wav(input_path: Path, output_path: Path) -> None:
    """Convert audio file to WAV format for Whisper compatibility.

    Args:
        input_path: Path to the input audio file.
        output_path: Path where the converted WAV file will be saved.

    Raises:
        ValueError: If the audio format is not supported.
        RuntimeError: If audio conversion fails.
    """
    try:
        file_extension = input_path.suffix.lower()

        if file_extension not in SUPPORTED_FORMATS:
            raise ValueError(
                f"Unsupported audio format: {file_extension}. "
                f"Supported formats: {', '.join(SUPPORTED_FORMATS)}"
            )

        logger.info(f"Converting {file_extension} to WAV format")

        # Load audio file with pydub
        audio = AudioSegment.from_file(str(input_path))

        # Export as WAV with Whisper-compatible settings
        audio.export(
            str(output_path),
            format="wav",
            parameters=["-ac", "1", "-ar", "16000"]  # Mono, 16kHz
        )

        logger.info(f"Audio conversion successful: {output_path}")
    except ValueError:
        raise
    except Exception as e:
        logger.error(f"Audio conversion failed: {e}")
        raise RuntimeError(f"Failed to convert audio file: {e}")


def transcribe_audio(audio_file_path: str) -> str:
    """Transcribe audio file to text using Whisper model.

    Args:
        audio_file_path: Path to the audio file to transcribe.

    Returns:
        str: The transcribed text.

    Raises:
        FileNotFoundError: If the audio file does not exist.
        ValueError: If the audio format is not supported.
        RuntimeError: If transcription fails.
    """
    audio_path = Path(audio_file_path)

    # Validate input file exists
    if not audio_path.exists():
        raise FileNotFoundError(f"Audio file not found: {audio_file_path}")

    # Validate file extension
    if audio_path.suffix.lower() not in SUPPORTED_FORMATS:
        raise ValueError(
            f"Unsupported audio format: {audio_path.suffix}. "
            f"Supported formats: {', '.join(SUPPORTED_FORMATS)}"
        )

    temp_wav_path: Optional[Path] = None

    try:
        logger.info(f"Starting transcription for: {audio_file_path}")

        # Load Whisper model
        model = load_whisper_model()

        # Convert to WAV if necessary
        if audio_path.suffix.lower() != ".wav":
            with tempfile.NamedTemporaryFile(
                suffix=".wav", delete=False
            ) as temp_wav:
                temp_wav_path = Path(temp_wav.name)

            convert_audio_to_wav(audio_path, temp_wav_path)
            transcription_path = str(temp_wav_path)
        else:
            transcription_path = audio_file_path

        # Transcribe audio
        logger.info("Running Whisper transcription")
        result = model.transcribe(
            transcription_path,
            language="zh",  # Set to Chinese, can be made configurable
            fp16=False,  # Disable FP16 for CPU compatibility
        )

        transcribed_text = result["text"].strip()
        logger.info(f"Transcription successful. Length: {len(transcribed_text)} chars")

        return transcribed_text

    except (FileNotFoundError, ValueError):
        raise
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        raise RuntimeError(f"Failed to transcribe audio: {e}")
    finally:
        # Clean up temporary WAV file
        if temp_wav_path and temp_wav_path.exists():
            try:
                os.remove(temp_wav_path)
                logger.debug(f"Cleaned up temporary file: {temp_wav_path}")
            except Exception as e:
                logger.warning(f"Failed to clean up temporary file: {e}")


async def transcribe_audio_async(audio_file_path: str) -> str:
    """Async wrapper for transcribe_audio to work with FastAPI.

    Args:
        audio_file_path: Path to the audio file to transcribe.

    Returns:
        str: The transcribed text.

    Raises:
        FileNotFoundError: If the audio file does not exist.
        ValueError: If the audio format is not supported.
        RuntimeError: If transcription fails.
    """
    # Note: Whisper transcription is CPU/GPU intensive and blocking
    # In production, consider using asyncio.to_thread or a task queue
    return transcribe_audio(audio_file_path)
