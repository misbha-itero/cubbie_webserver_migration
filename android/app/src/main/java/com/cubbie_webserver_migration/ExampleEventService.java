package com.cubbie_webserver_migration;

import android.content.Intent;

import android.os.Bundle;

import androidx.annotation.Nullable;

import com.facebook.react.HeadlessJsTaskService;

import com.facebook.react.bridge.Arguments;

import com.facebook.react.jstasks.HeadlessJsTaskConfig;

public class ExampleEventService extends HeadlessJsTaskService {

   @Nullable

   protected HeadlessJsTaskConfig getTaskConfig(Intent intent) {

       Bundle extras = intent.getExtras();

       return new HeadlessJsTaskConfig(

               "Example",

               extras != null ? Arguments.fromBundle(extras) : Arguments.createMap(),

               5000,

               true);

   }

}
