package com.kitchencollection.app;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // super.onCreate switches to the no-action-bar theme first. Enabling
        // edge-to-edge before that created the window with the launch theme,
        // which left a dark title bar ("Kitchen Collection") above the app.
        super.onCreate(savedInstanceState);
        // Required by Capacitor 8 SystemBars when insetsHandling is not "disable"
        EdgeToEdge.enable(this);
    }
}
