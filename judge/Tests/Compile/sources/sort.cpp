#include <bits/stdc++.h>

using namespace std;

typedef long long ll;
typedef unsigned long long ull;
typedef unsigned int uint;
typedef double rl;

#define pb push_back
#define popb pop_back
#define mp make_pair
#define mt make_tuple

#if 0
#define dbg(x) cerr << #x << ":" << (x) << endl;
#else
#define dbg(x)
#endif // 0

int n;
vector<int> tmp;

int main()
{
    //freopen("input.txt", "r", stdin);
    //freopen(".out", "w+", stdout);
    //ios_base::sync_with_stdio( false );cin.tie(0); cout.tie(0);
    scanf("%d", &n);
    for (int i=0; i<n; i++)
    {
        int t;
        scanf("%d", &t);
        tmp.push_back(t);
    }

    sort(tmp.begin(), tmp.end());

    for (auto t : tmp)
      printf("%d ", t);
    printf("\n");

    return 0;
}


