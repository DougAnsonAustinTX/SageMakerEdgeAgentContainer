#!/bin/sh

#
# Home
#
export HOME="/usr/src/app"

#
# Bring in the configuration
#
. ./sagemaker-agent-pt/.env

#
# Roll logs
#
roll_logs() {
    if [ -f ${HOME}/logs/service.log ]; then
        mv ${HOME}/logs/service.log ${HOME}/logs/service.log-$$
    fi
    if [ -f ${HOME}/logs/socat.log ]; then
        mv ${HOME}/logs/socat.log ${HOME}/logs/socat.log-$$
    fi
    if [ -f ${HOME}/logs/pt.log ]; then
        mv ${HOME}/logs/pt.log ${HOME}/logs/pt.log-$$
    fi
}

#
# Launch Sagemaker Edge Agent
#
launch_sagemaker() {
    echo "Launching edge-agent Address: unix://"${SAPT_SAGE_SOCKET_FILE} " Config: "${SAPT_NEO_CONFIG_FILE} > ${HOME}/logs/service.log 2>&1
    ${HOME}/sagemaker_edge_agent_binary -a ${SAPT_SAGE_SOCKET_FILE} -c ${SAPT_NEO_CONFIG_FILE} >> ${HOME}/logs/service.log 2>&1 &
}

#
# Launch socat 
#
launch_socat() {
    echo "Launching socat mapper: unix://"${SAPT_SAGE_SOCKET_FILE} "Inet: dns://localhost:"${SAPT_MAP_PORT} > ${HOME}/logs/socat.log 2>&1
    socat TCP-LISTEN:${SAPT_MAP_PORT},fork UNIX-CONNECT:${SAPT_SAGE_SOCKET_FILE} >> ${HOME}/logs/socat.log 2>&1 &
}

#
# Run PT
#
run_pt() {
    if [ -d ${HOME}/sagemaker-agent-pt ]; then
        cd ${HOME}/sagemaker-agent-pt
        if [ -f ./sagemaker-agent-pt.js ]; then
            echo "Running Sagemaker PT..." > ${HOME}/logs/pt.log 2>&1
            while :
            do
                node ./sagemaker-agent-pt.js >> ${HOME}/logs/pt.log 2>&1
                echo "Sagemaker PT has died... restarting..." >> ${HOME}/logs/pt.log 2>&1
                sleep 5
            done
        else
            echo "Unable to find Sagemaker PT JS... sleeping..." > ${HOME}/logs/pt.log 2>&1
        fi
    else
        echo "Unable to Run Sagemaker PT... file not found. Sleeping..." > ${HOME}/logs/pt.log 2>&1
    fi
}

#
# Main
#
main() {
    # Roll Logs
    roll_logs $*

    # Launch Sagemaker Agent
    # launch_sagemaker $*

    # Launch Socat
    launch_socat $*

    # Run Edge PT forever
    run_pt $*

    #
    # Should never be reached
    #
    while true; do
        sleep 10000
    done
}

main $*