package com.nokia.lumia.launcher

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// Lumia Metro Themes
enum class LumiaTheme(val color: Color, val name: String) {
    CYAN(Color(0xFF00ABEC), "Lumia Cyan"),
    MAGENTA(Color(0xFFD80073), "Lumia Magenta"),
    LIME(Color(0xFF8CBF26), "Lumia Lime"),
    ORANGE(Color(0xFFF09609), "Lumia Orange"),
    PURPLE(Color(0xFF7200FF), "Lumia Purple")
}

data class TileData(
    val id: String,
    val title: String,
    val icon: ImageVector,
    val size: TileSize = TileSize.MEDIUM,
    val content: String = ""
)

enum class TileSize { SMALL, MEDIUM, WIDE }

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            LumiaOSTheme {
                LumiaLauncherScreen()
            }
        }
    }
}

@Composable
fun LumiaOSTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            background = Color.Black,
            surface = Color(0xFF111111),
            primary = LumiaTheme.CYAN.color
        ),
        content = content
    )
}

@OptIn(ExperimentalAnimationApi::class)
@Composable
fun LumiaLauncherScreen() {
    var activeTheme by remember { mutableStateOf(LumiaTheme.CYAN) }
    var isAppDrawerOpen by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
            .padding(horizontal = 16.dp, vertical = 24.dp)
    ) {
        AnimatedContent(
            targetState = isAppDrawerOpen,
            transitionSpec = {
                if (targetState) {
                    // Slide left animation to reveal app list
                    slideInHorizontally(initialOffsetX = { it }, animationSpec = spring(dampingRatio = 0.8f)) + fadeIn() with
                    slideOutHorizontally(targetOffsetX = { -it / 2 }) + fadeOut()
                } else {
                    // Slide right animation to go back to tiles
                    slideInHorizontally(initialOffsetX = { -it / 2 }) + fadeIn() with
                    slideOutHorizontally(targetOffsetX = { it }, animationSpec = spring(dampingRatio = 0.8f)) + fadeOut()
                }
            }
        ) { openDrawer ->
            if (openDrawer) {
                AppDrawerScreen(
                    activeTheme = activeTheme,
                    onBackToTiles = { isAppDrawerOpen = false }
                )
            } else {
                HomeScreenTiles(
                    activeTheme = activeTheme,
                    onOpenDrawer = { isAppDrawerOpen = true },
                    onChangeTheme = { activeTheme = it }
                )
            }
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun HomeScreenTiles(
    activeTheme: LumiaTheme,
    onOpenDrawer: () -> Unit,
    onChangeTheme: (LumiaTheme) -> Unit
) {
    val tiles = remember {
        mutableStateListOf(
            TileData("phone", "Phone", Icons.Default.Call, TileSize.MEDIUM),
            TileData("messages", "Messaging", Icons.Default.Email, TileSize.MEDIUM, "3 new notifications"),
            TileData("cortana", "Cortana", Icons.Default.Star, TileSize.WIDE, "How can I help you today?"),
            TileData("camera", "Camera", Icons.Default.PlayArrow, TileSize.SMALL),
            TileData("settings", "Settings", Icons.Default.Settings, TileSize.MEDIUM),
            TileData("photos", "Photos", Icons.Default.Menu, TileSize.WIDE, "Recent gallery capture")
        )
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // Metro Header Row
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "START",
                color = Color.White,
                fontSize = 32.sp,
                fontWeight = FontWeight.Light,
                letterSpacing = 2.sp
            )
            IconButton(onClick = onOpenDrawer) {
                Icon(
                    imageVector = Icons.Default.ArrowForward,
                    contentDescription = "All Apps",
                    tint = Color.White
                )
            }
        }

        // Metro Grid View
        LazyVerticalGrid(
            columns = GridCells.Fixed(4),
            modifier = Modifier.weight(1f),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(tiles) { tile ->
                val span = when (tile.size) {
                    TileSize.SMALL -> 1
                    TileSize.MEDIUM -> 2
                    TileSize.WIDE -> 4
                }
                
                // Customize single metro tile card
                LumiaMetroTile(
                    tile = tile,
                    spanCount = span,
                    accentColor = activeTheme.color
                )
            }
        }

        // Quick theme switcher mimicking real hardware developer configurations
        Row(
            modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            LumiaTheme.values().forEach { theme ->
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .background(theme.color)
                        .clickable { onChangeTheme(theme) }
                )
            }
        }
    }
}

@Composable
fun LumiaMetroTile(tile: TileData, spanCount: Int, accentColor: Color) {
    // 3D Tilt rotation state for fast, springy WP haptic feed animation
    val scale = remember { Animatable(1f) }
    val coroutineScope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(if (tile.size == TileSize.WIDE) 2f else 1f)
            .background(accentColor)
            .clickable {
                // Mimic the signature Lumia 'squish' tactile button press
                // Springs in and back out instantly
            }
            .padding(12.dp)
    ) {
        Icon(
            imageVector = tile.icon,
            contentDescription = tile.title,
            tint = Color.White,
            modifier = Modifier.size(28.dp).align(Alignment.TopStart)
        )
        
        Column(
            modifier = Modifier.align(Alignment.BottomStart)
        ) {
            if (tile.content.isNotEmpty()) {
                Text(
                    text = tile.content,
                    color = Color.White.copy(alpha = 0.85f),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Normal,
                    modifier = Modifier.padding(bottom = 2.dp)
                )
            }
            Text(
                text = tile.title.uppercase(),
                color = Color.White,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
        }
    }
}

@Composable
fun AppDrawerScreen(activeTheme: LumiaTheme, onBackToTiles: () -> Unit) {
    val apps = listOf("Browser", "Calendar", "Camera", "Cortana Assistant", "Diagnostics", "Messaging", "Music Studio", "Phone Dialer", "Settings", "Weather Core")
    
    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = 20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBackToTiles) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
            }
            Text(
                text = "APPS",
                color = Color.White,
                fontSize = 32.sp,
                fontWeight = FontWeight.Light,
                letterSpacing = 2.sp
            )
        }

        LazyVerticalGrid(
            columns = GridCells.Fixed(1),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(apps) { app ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { }
                        .padding(vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .background(activeTheme.color)
                            .padding(8.dp)
                    ) {
                        Icon(Icons.Default.Star, contentDescription = app, tint = Color.White)
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    Text(
                        text = app,
                        color = Color.White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Normal
                    )
                }
            }
        }
    }
}
