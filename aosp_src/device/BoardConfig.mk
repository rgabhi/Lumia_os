#
# BoardConfig.mk for Nokia Lumia MSM8992 AOSP Custom Build
# Defines low-level SoC features, partition mapping, and kernel variables.
#

TARGET_BOARD_PLATFORM := msm8992
TARGET_BOOTLOADER_BOARD_NAME := lumia

# Core Architecture Settings (Qualcomm Snapdragon 808 64-bit Hexa-Core)
TARGET_ARCH := arm64
TARGET_ARCH_VARIANT := armv8-a
TARGET_CPU_ABI := arm64-v8a
TARGET_CPU_ABI2 :=
TARGET_CPU_VARIANT := generic

TARGET_2ND_ARCH := arm
TARGET_2ND_ARCH_VARIANT := armv7-a-neon
TARGET_2ND_CPU_ABI := armeabi-v7a
TARGET_2ND_CPU_ABI2 := armeabi
TARGET_2ND_CPU_VARIANT := krait

# Kernel Parameters
BOARD_KERNEL_CMDLINE := console=ttyMSM0,115200n8 androidboot.hardware=lumia androidboot.selinux=enforcing
BOARD_KERNEL_BASE := 0x80000000
BOARD_KERNEL_PAGESIZE := 4096
BOARD_MKBOOTIMG_ARGS := --ramdisk_offset 0x01000000 --tags_offset 0x00000100

# File System Partition Sizes (Lumia 32GB Internal storage specs)
BOARD_BOOTIMAGE_PARTITION_SIZE := 33554432     # 32MB boot partition
BOARD_RECOVERYIMAGE_PARTITION_SIZE := 33554432 # 32MB recovery partition
BOARD_SYSTEMIMAGE_PARTITION_SIZE := 3221225472   # 3.0GB system partition
BOARD_USERDATAIMAGE_PARTITION_SIZE := 25769803776 # 24GB user partition
BOARD_FLASH_BLOCK_SIZE := 131072

# SELinux Policies config
BOARD_SEPOLICY_DIRS += device/nokia/msm8992/sepolicy

# Compile Rust HAL components into Android system binaries
TARGET_USES_RUST := true
BOARD_HAL_LIGHTS_RUST_BIN := lights.primary.lumia
BOARD_HAL_AUDIO_RUST_BIN := audio.primary.lumia
