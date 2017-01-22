#define _GNU_SOURCE
#include <sys/wait.h>
#include <sys/utsname.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <grp.h>
#include <pwd.h>
#include <sched.h>
#include <string.h>
#include <stdio.h>
#include <fcntl.h>
#include <stdlib.h>
#include <unistd.h>
#include <errno.h>
#include <stdlib.h>
#include <signal.h>
#include <string.h>
#include <limits.h>

#define errExit(msg) do{ perror(msg); exit(EXIT_FAILURE); } while(0)

struct child_args{
    char* hostname;
    int pipe_fd[2];
};

static int child_main(void *arg)
{
    struct utsname uts;
    struct child_args *args = (struct child_args*) arg;
    char ch;

    /* Wait until parent has updated the UID mappings. */
    close(args->pipe_fd[1]);
    if (read(args->pipe_fd[0], &ch, 1) != 0){
        fprintf(stderr, "Failure in child: read from pipe returned !=0\n");
        exit(EXIT_FAILURE);
    }

    // Set hostname for child
    if (sethostname(args->hostname, strlen(arg)) == -1){
        fprintf(stderr, "Failure in child: setting up hostname!\n");
        exit(EXIT_FAILURE);
    }

    if (uname(&uts) == -1)
    {
        fprintf(stderr, "Failure in child: retrieving uts\n");
        exit(EXIT_FAILURE);
    }
    printf("child: uts.nodename is %s\n", uts.nodename);

    // Check if /rjudge is a existing directory
    struct stat st;
    if (stat("/rjudge", &st) == -1){
        fprintf(stderr, "Failure in child:\\rjudge directory does not exist\n");
        exit(EXIT_FAILURE);
    }

    if (S_ISDIR(st.st_mode) == 0) {
        fprintf(stderr, "Failure in child:\\rjudge is not a directory\n");
        exit(EXIT_FAILURE);
    }

    // CHROOT inside /rjudge
    if (chdir("/rjudge") == -1){
        fprintf(stderr, "Failure in child: change dir to /rjudge\n");
        exit(EXIT_FAILURE);
    }

    if (chroot("/rjudge") == -1){
        fprintf(stderr, "Failure in child: Failed chroot to /rjudge");
        exit(EXIT_FAILURE);
    }

    char* pwd;
    pwd = getenv ("PWD");
    if (pwd!=NULL)
        printf ("child: The current PWD is: %s",pwd);


    uid_t judge_uid = 1001;

    setgid(1001);
    setgroups(1, (gid_t[]){(gid_t) 1001});
    setuid(judge_uid);

    execv("/bin/bash",(char * const[]){(char*)"/bin/bash", (char*)NULL});

    return 0;
}

#define STACK_SIZE (1024 * 1024)
#define MAP_BUF_SIZE 1024

static char child_stack[STACK_SIZE];

int main(int argc, char *argv[])
{
    pid_t child_pid;
    struct child_args args;

    const char hostname[] ="Judge";
    args.hostname = (char*) hostname;

    if (pipe(args.pipe_fd) == -1)
    {
        printf("Failed to create pipe\n");
        exit(EXIT_FAILURE);
    }

    int child_flags = CLONE_NEWNS | CLONE_NEWPID | CLONE_NEWUTS | CLONE_NEWNET;
    child_pid = clone(child_main, child_stack + STACK_SIZE, child_flags | SIGCHLD, &args);

    if (child_pid == -1)
    {
        printf("Failed to create child process\n");
        exit(EXIT_FAILURE);
    }

    printf("%s: PID of child created by clone() is %ld\n", argv[0], (long) child_pid);

    // Insert here necessary setup required for child setup from parent process.

    close(args.pipe_fd[1]);

    if (waitpid(child_pid, NULL, 0) == -1)      /* Wait for child */
    {
        printf("Failed to create child process\n");
        exit(EXIT_FAILURE);
    }

    printf("Child terminated\n");

    exit(EXIT_SUCCESS);
}
