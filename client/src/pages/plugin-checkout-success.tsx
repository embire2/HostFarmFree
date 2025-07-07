import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Heart, Download, ArrowRight, Home } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import Navbar from "@/components/navbar";

export default function PluginCheckoutSuccess() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <Navbar />
      
      <div className="flex items-center justify-center p-4 pt-20">
        <Card className="max-w-2xl mx-auto shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-green-700 mb-4">
              Thank You for Your Donation! 🎉
            </h1>
            
            <p className="text-xl text-gray-600 mb-6">
              Your $5 donation has been successfully processed!
            </p>
            
            <div className="bg-green-50 rounded-lg p-6 mb-6">
              <Heart className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-green-800 mb-2">
                Your Support Makes a Difference
              </h2>
              <p className="text-green-700">
                Your donation helps us maintain and improve this plugin, keeping it updated 
                and adding new features for the community.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="text-center p-4 bg-white rounded-lg border">
                <Download className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-800">Keep Using</h3>
                <p className="text-sm text-gray-600">Continue using the plugin as before</p>
              </div>
              
              <div className="text-center p-4 bg-white rounded-lg border">
                <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-800">Community Support</h3>
                <p className="text-sm text-gray-600">Help other developers access free tools</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <Button 
                onClick={() => setLocation('/plugins')}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Browse More Plugins
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setLocation('/')}
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Return to Home
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 mt-6">
              You will receive an email confirmation shortly. Thank you for supporting HostFarm.org!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}