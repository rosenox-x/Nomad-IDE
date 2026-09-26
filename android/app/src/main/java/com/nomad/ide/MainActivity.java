package com.nomad.ide;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.Window;

import com.getcapacitor.BridgeActivity;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

public class MainActivity extends BridgeActivity {
	@Override
	public void onCreate(Bundle savedInstanceState) {
		Window window = getWindow();
		WindowCompat.setDecorFitsSystemWindows(window, false);
		window.setStatusBarColor(Color.TRANSPARENT);
		window.setNavigationBarColor(Color.TRANSPARENT);

		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
			window.setStatusBarContrastEnforced(false);
			window.setNavigationBarContrastEnforced(false);
		}

		super.onCreate(savedInstanceState);

		WindowInsetsControllerCompat insetsController =
				new WindowInsetsControllerCompat(window, window.getDecorView());
		insetsController.setAppearanceLightStatusBars(true);
		insetsController.setAppearanceLightNavigationBars(true);
	}
}
