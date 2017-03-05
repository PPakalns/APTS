#include <bits/stdc++.h>

using namespace std;

typedef long long ll;

const int MAXN = 1000000;
const ll inf = 4LL * 1000000000LL * 1000000000LL;

int nx, ny, nop;
ll d1, d2, inv1, inv2;
ll x[ MAXN ];
ll y[ MAXN ];

inline ll V(const int a, int pos)
{
    if (a==1)
    {
        if (pos >= nx)
            return inf;
        return inv1*x[ (inv1 == 1) ? pos : nx-pos-1 ] + d1;
    }
    else
    {
        if (pos >= ny)
            return inf;
        return inv2*y[ (inv2 == 1) ? pos : ny-pos-1 ] + d2;
    }
}

ll Solve()
{
    int rem = ((nx+ny)>>1) + 1, o1 = 0, o2 = 0;

    int last = 0;
    while (rem>0)
    {
        if (V(1, o1)<=V(2,o2))
            last = V(1, o1), o1++;
        else
            last = V(2, o2), o2++;
        rem--;
    }
    return last;
}

void makeArr(ll* x, int nx)
{
    ll x0, a, c, m, d=0;
    scanf("%lld %lld %lld %lld", &x0, &a, &c, &m);

    x[ 0 ] = x0;
    for (int i=1; i<nx; i++)
    {
        d = (a*d + c)%m;
        x[ i ] = x[ i-1 ] + d;
    }
}

int main()
{
#ifndef EVAL
    freopen("mediana.dat", "r", stdin);
    freopen("mediana.rez", "w", stdout);
#endif

    scanf("%d %d %d", &nx, &ny, &nop);
    makeArr(x, nx);
    makeArr(y, ny);
    inv1 = inv2 = 1;

    char OP, MAS;
    int delta;
    for (int i=0; i<nop; i++)
    {
        scanf("\n%c ", &OP);
        switch (OP)
        {
            case 'A':
                scanf("%c", &MAS);
                switch (MAS)
                {
                    case 'X': inv1 *= -1; d1 = -d1; break;
                    case 'Y': inv2 *= -1; d2 = -d2; break;
                }
                break;
            case 'B':
                scanf("%c %d", &MAS, &delta);
                switch (MAS)
                {
                    case 'X': d1 += delta; break;
                    case 'Y': d2 += delta; break;
                }
                break;
            case 'C':
                printf("%lld\n", Solve());
                break;
        }
    }
    return 0;
}

