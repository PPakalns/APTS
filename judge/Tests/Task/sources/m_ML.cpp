#include <bits/stdc++.h>

using namespace std;

vector<vector<int>> v;

int main()
{
    for (int i=0; i<100000000; i++)
    {
        vector<int> tmp(8,i%9);
        v.push_back(tmp);
    }
    printf("%d\n",v[ 100000000-1 ][ 2 ]);
    return 0;
}


