const storagekeys = {
    BACKGROUND_TASK_STATUS_KEY: 'BACKGROUND_TASK_STATUS',
    SERVER_STATUS_KEY: 'SERVER_STATUS',
    MEDIAMANAGER: 'MEDIAMANAGER',
    LIGHTMANAGER: 'LIGHTMANAGER',
    PIN: 'PIN',
    OTP: 'OTP',
    ORG_ID: 'ORG_ID',
    CUBBIE_ID: 'CUBBIE_ID',
    STUDENTID: 'STUDENT_ID',
    ISFIRSTSESSION: 'IS_FIRST_SESSION',
    CURRENTPLAYLISTARGS: 'CURRENT_PLAYLIST_ARGS',
    CURRENTPLAYLIST: 'CURRENT_PLAYLIST',
    TAKE_CONTROL: 'TAKE_CONTROL',
    SESSION_DATA: 'SESSION_DATA',
    HISTORYID: 'HISTORY_ID',
    PLAYLISTSTARTTIME: 'PLAY_LIST_START_TIME',
    ISSESSIONSUBMITTING: 'IS_SESSION_SUBMITTING',
    DOWNLOADCUBBIEPATH: 'DOWNLOAD_CUBBBIE_PATH',
    AUDIOPATH: 'AUDIO_PATH',
    VIDEOPATH: 'VIDEO_PATH',
    ISFILEALREADYEXISTS: 'IS_FILE_ALREADY_EXISTS',
    ISFIRSTRENDER: 'IS_FIRST_RENDER'
};

const contentUri = {
  DOWNLOAD_CUBBIE_PATH:
    'content://com.android.externalstorage.documents/tree/primary%3ADownload%2FCubbie/document/primary%3ADownload%2FCubbie',
  VIDEO_PATH:
    'content://com.android.externalstorage.documents/tree/primary%3ADownload%2FCubbie%2Fmedia%2Fvideos/document/primary%3ADownload%2FCubbie%2Fmedia%2Fvideos',
  AUDIO_PATH:
    'content://com.android.externalstorage.documents/tree/primary%3ADownload%2FCubbie%2Fmedia%2Faudios/document/primary%3ADownload%2FCubbie%2Fmedia%2Faudios'
}

export { storagekeys, contentUri }
