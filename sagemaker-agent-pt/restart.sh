#!/bin/sh

rm sagemaker-agent-pt.js ; vi sagemaker-agent-pt.js 
PID=`ps -ef | grep node | grep -v grep | awk '{print $2}'`
/bin/kill -SIGHUP ${PID}
tail -f ../logs/pt.log
