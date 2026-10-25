package com.kitchencollection.app;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Required by Capacitor 8 SystemBars when insetsHandling is not "disable"
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }
}
