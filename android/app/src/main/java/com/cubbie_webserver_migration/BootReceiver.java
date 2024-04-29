// BootReceiver.java

package com.cubbie_webserver_migration;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class BootReceiver extends BroadcastReceiver {

   @Override

   public void onReceive(Context context, Intent intent) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(new Intent(context, ExampleService.class));
    } else {
        context.startService(new Intent(context, ExampleService.class));
    }
}

}